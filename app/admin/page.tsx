"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse"; // ✅ Import para CSV

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Produto = {
  id?: string;
  nome: string;
  descricao?: string;
  preco_venda: number;
  categoria: string;
  codigo_barras?: string;
  imagem?: string;
  estoque: number;
};

export default function AdminPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [arquivoCSV, setArquivoCSV] = useState<File | null>(null); // ✅ novo estado

  const [form, setForm] = useState<Produto>({
    nome: "",
    descricao: "",
    preco_venda: 0,
    categoria: "",
    codigo_barras: "",
    imagem: "",
    estoque: 0,
  });

  const ITENS_POR_PAGINA = 10;

  useEffect(() => {
    carregarCategorias();
  }, []);

  useEffect(() => {
    buscarProdutos();
  }, [pagina, categoriaFiltro]);

  async function carregarCategorias() {
    const { data, error } = await supabase
      .from("produtos")
      .select("categoria")
      .not("categoria", "is", null);

    if (!error && data) {
      const unicas = Array.from(new Set(data.map((p) => p.categoria))).sort();
      setCategorias(unicas);
    }
  }

  async function buscarProdutos() {
    const inicio = (pagina - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA - 1;

    let query = supabase
      .from("produtos")
      .select("*", { count: "exact" })
      .order("nome", { ascending: true })
      .range(inicio, fim);

    if (busca)
      query = query.or(`nome.ilike.%${busca}%,codigo_barras.ilike.%${busca}%`);
    if (categoriaFiltro) query = query.eq("categoria", categoriaFiltro);

    const { data, error, count } = await query;

    if (!error) {
      setProdutos(data || []);
      setTotalPaginas(Math.ceil((count || 1) / ITENS_POR_PAGINA));
    } else console.error(error);
  }

  async function salvarProduto() {
    if (!form.nome || !form.preco_venda) {
      alert("Preencha nome e preço!");
      return;
    }

    const payload = { ...form };

    if (editando) {
      const { error } = await supabase
        .from("produtos")
        .update(payload)
        .eq("id", editando.id);
      if (!error) {
        alert("Produto atualizado!");
        limparFormulario();
        buscarProdutos();
      }
    } else {
      const { error } = await supabase.from("produtos").insert([payload]);
      if (!error) {
        alert("Produto salvo!");
        limparFormulario();
        buscarProdutos();
      }
    }
  }

  async function excluirProduto(id: string) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (!error) {
      alert("Produto excluído!");
      buscarProdutos();
    }
  }

  async function uploadImagem(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("produtos")
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("produtos")
        .getPublicUrl(fileName);

      if (publicUrlData?.publicUrl) {
        setForm({ ...form, imagem: publicUrlData.publicUrl });
        alert("✅ Imagem enviada com sucesso!");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Erro ao enviar imagem!");
    } finally {
      setUploading(false);
    }
  }

  function editarProduto(produto: Produto) {
    setEditando(produto);
    setForm(produto);
  }

  function limparFormulario() {
    setEditando(null);
    setForm({
      nome: "",
      descricao: "",
      preco_venda: 0,
      categoria: "",
      codigo_barras: "",
      imagem: "",
      estoque: 0,
    });
  }

  // 📊 Exportar CSV com ID e CÓDIGO DE BARRAS
  function exportarCSV() {
    const csvHeader = "id,Nome,Descrição,Preço,Categoria,EAN,Estoque\n";
    const csvBody = produtos
      .map(
        (p) =>
          `${p.id || ""},"${p.nome}","${p.descricao || ""}",${p.preco_venda},"${
            p.categoria
          }","${p.codigo_barras || ""}",${p.estoque}`
      )
      .join("\n");

    const blob = new Blob([csvHeader + csvBody], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "produtos_IA_Drogarias.csv";
    link.click();
  }

  // 📥 Importar CSV — atualiza por ID ou EAN
  async function importarCSV() {
    if (!arquivoCSV) return alert("Selecione um arquivo CSV primeiro!");

    Papa.parse(arquivoCSV, {
      header: true,
      complete: async (results) => {
        const linhas = results.data;

        for (const linha of linhas) {
          if (!linha.id && !linha.EAN) continue;

          const updateData: any = {};
          if (linha.Preço) updateData.preco_venda = parseFloat(linha.Preço);
          if (linha.Estoque) updateData.estoque = parseInt(linha.Estoque);

          if (Object.keys(updateData).length === 0) continue;

          const filtro = linha.id
            ? { coluna: "id", valor: linha.id }
            : { coluna: "codigo_barras", valor: linha.EAN };

          const { error } = await supabase
            .from("produtos")
            .update(updateData)
            .eq(filtro.coluna, filtro.valor);

          if (error)
            console.error("Erro ao atualizar:", linha.Nome, error.message);
        }

        alert("✅ Atualização em massa concluída com sucesso!");
        setArquivoCSV(null);
        buscarProdutos();
      },
    });
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">
        Painel Administrativo
      </h1>

      {/* FORMULÁRIO ORIGINAL */}
      {/* ... mantém todo o resto do seu layout igual ... */}

      {/* BOTÕES */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={salvarProduto}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editando ? "Atualizar Produto" : "Salvar Produto"}
        </button>
        {editando && (
          <button
            onClick={limparFormulario}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={exportarCSV}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          📊 Exportar CSV
        </button>

        {/* 📥 Importar CSV */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setArquivoCSV(e.target.files?.[0] || null)}
            className="border p-2 rounded"
          />
          <button
            onClick={importarCSV}
            className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
          >
            📥 Importar CSV
          </button>
        </div>
      </div>

      {/* Resto da página (tabela, paginação...) inalterado */}
    </main>
  );
}