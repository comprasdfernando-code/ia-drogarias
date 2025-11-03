"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import  UploadVideo  from "../../components/UploadVideo";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Produto = {
  id?: string;
  nome: string;
  descricao?: string;
  preco_venda: number;
  preco_custo?: number;
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

  const [form, setForm] = useState<Produto>({
    nome: "",
    descricao: "",
    preco_venda: 0,
    preco_custo: 0,
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
      preco_custo: 0,
      categoria: "",
      codigo_barras: "",
      imagem: "",
      estoque: 0,
    });
  }

  function exportarCSV() {
    const csvHeader = "Nome,Descrição,Preço Venda,Preço Custo,Categoria,EAN,Estoque\n";
    const csvBody = produtos
      .map(
        (p) =>
          `${p.nome},${p.descricao || ""},${p.preco_venda},${p.preco_custo || ""},${p.categoria},${p.codigo_barras || ""
          },${p.estoque}`
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

  // 📥 IMPORTAR CSV (atualiza preço, custo e estoque pelo código de barras)
  async function importarCSV(e: any) {
  const file = e.target.files[0];
  if (!file) return;

  const text = await file.text();
  const linhas = text.split("\n").slice(1); // pula o cabeçalho

  let atualizados = 0;
  for (const linha of linhas) {
    const [codigo_barras, nome, estoque, preco_venda, preco_custo] = linha.split(",");
    if (!codigo_barras) continue;

    const { error } = await supabase
      .from("produtos")
      .update({
        nome: nome?.trim(),
        estoque: parseInt(estoque) || 0,
        preco_venda: parseFloat(preco_venda) || 0,
        preco_custo: parseFloat(preco_custo) || 0,
      })
      .eq("codigo_barras", codigo_barras.trim());

    if (!error) atualizados++;
    else console.error("Erro ao atualizar:", codigo_barras, error);
  }

  alert(`✅ Atualização concluída com sucesso! ${atualizados} produtos atualizados.`);
  buscarProdutos();
}

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">
        Painel Administrativo
      </h1>

      {/* FORMULÁRIO */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <input type="text" placeholder="Nome do Produto" value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          className="border p-2 rounded" />

        <input type="number" placeholder="Preço de Venda" value={form.preco_venda}
          onChange={(e) => setForm({ ...form, preco_venda: parseFloat(e.target.value) })}
          className="border p-2 rounded" />

        <input type="number" placeholder="Preço de Custo" value={form.preco_custo}
          onChange={(e) => setForm({ ...form, preco_custo: parseFloat(e.target.value) })}
          className="border p-2 rounded" />

        <input type="text" placeholder="Categoria" value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          className="border p-2 rounded" />

        <input type="text" placeholder="Código de Barras (EAN)" value={form.codigo_barras}
          onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })}
          className="border p-2 rounded" />

        <input type="number" placeholder="Estoque" value={form.estoque}
          onChange={(e) => setForm({ ...form, estoque: parseInt(e.target.value) })}
          className="border p-2 rounded" />

        {/* Upload Imagem */}
        <div className="flex flex-col gap-2">
          <input type="file" accept="image/*" onChange={uploadImagem} disabled={uploading}
            className="border p-2 rounded" />
          {uploading && <p className="text-sm text-gray-500">Enviando...</p>}
          {form.imagem && <img src={form.imagem} alt="Prévia" className="w-24 h-24 object-cover rounded" />}
        </div>

        <textarea placeholder="Descrição do produto" value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          className="border p-2 rounded col-span-2 h-24" />
      </div>

      {/* 🔹 UPLOAD DE VÍDEOS PROMOCIONAIS / HISTÓRIAS */}
<div className="my-10 p-6 bg-gray-50 border rounded-lg shadow-sm">
  <h2 className="text-lg font-bold text-blue-700 mb-3">
    🎥 Upload de Vídeos (Promoções / Histórias)
  </h2>
  <p className="text-sm text-gray-600 mb-4">
    Envie vídeos .mp4 para suas campanhas do <strong>Gigante dos Assados</strong> ou <strong>IA Drogarias</strong>.
  </p>

  <UploadVideo bucket="videos_gigante" titulo="🍗 Vídeos - Gigante dos Assados" />
  <hr className="my-6" />
  <UploadVideo bucket="videos_drogarias" titulo="💊 Histórias - IA Drogarias" />
</div>

      {/* BOTÕES */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button onClick={salvarProduto} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {editando ? "Atualizar Produto" : "Salvar Produto"}
        </button>
        {editando && (
          <button onClick={limparFormulario}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
            Cancelar
          </button>
        )}
        <button onClick={exportarCSV}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          📊 Exportar CSV
        </button>

        <label className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded cursor-pointer">
          📥 Importar CSV
          <input type="file" accept=".csv" onChange={importarCSV} className="hidden" />
        </label>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input type="text" placeholder="Buscar por nome ou código de barras" value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border p-2 rounded flex-grow" />
        <select value={categoriaFiltro} onChange={(e) => {
          setCategoriaFiltro(e.target.value); setPagina(1);
        }} className="border p-2 rounded">
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button onClick={() => { setPagina(1); buscarProdutos(); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Buscar
        </button>
      </div>

      {/* TABELA */}
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Nome</th>
            <th className="border p-2">Categoria</th>
            <th className="border p-2">Preço Venda</th>
            <th className="border p-2">Preço Custo</th>
            <th className="border p-2">Estoque</th>
            <th className="border p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((p) => (
            <tr key={p.id}>
              <td className="border p-2">{p.nome}</td>
              <td className="border p-2">{p.categoria}</td>
              <td className="border p-2">R$ {p.preco_venda?.toFixed(2)}</td>
              <td className="border p-2 text-gray-600">R$ {p.preco_custo?.toFixed(2)}</td>
              <td className="border p-2">{p.estoque}</td>
              <td className="border p-2 text-center">
                <button onClick={() => editarProduto(p)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600">
                  Editar
                </button>
                <button onClick={() => excluirProduto(p.id!)}
                  className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINAÇÃO */}
      <div className="flex justify-between items-center mt-4">
        <button onClick={() => setPagina(Math.max(1, pagina - 1))}
          disabled={pagina === 1}
          className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50">
          ⬅ Anterior
        </button>
        <span>Página {pagina} de {totalPaginas}</span>
        <button onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
          disabled={pagina === totalPaginas}
          className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50">
          Próximo ➡
        </button>
      </div>
    </main>
  );
}