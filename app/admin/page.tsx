"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [novoProduto, setNovoProduto] = useState({
    nome: "",
    categoria: "",
    preco_venda: 0,
    estoque: 0,
    disponivel: true,
  });

  // 🔄 Carregar produtos
  useEffect(() => {
    async function carregarProdutos() {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("loja", "drogariaredefabiano")
        .order("nome", { ascending: true });

      if (error) console.error("Erro ao carregar:", error);
      else setProdutos(data || []);
      setCarregando(false);
    }

    carregarProdutos();
  }, []);

  // 💾 Atualizar produto no Supabase
  async function atualizarProduto(id: string, campo: string, valor: any) {
    const { error } = await supabase
      .from("produtos")
      .update({ [campo]: valor })
      .eq("id", id);

    if (error) console.error("Erro ao atualizar:", error);
    else setProdutos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
    );
  }

  // 🆕 Adicionar novo produto
  async function adicionarProduto() {
    if (!novoProduto.nome) return alert("Preencha o nome do produto!");

    const { data, error } = await supabase.from("produtos").insert([
      {
        ...novoProduto,
        loja: "drogariaredefabiano",
        imagem: "",
      },
    ]);

    if (error) console.error("Erro ao adicionar:", error);
    else window.location.reload();
  }

  // 📸 Upload de imagem
  async function uploadImagem(produto: any, arquivo: File) {
    const nomeArquivo = '${produto.id}-${arquivo.name}';
    const caminho = 'drogariaredefabiano/${nomeArquivo}';

    // Envia pro bucket "produtos"
    const { error: uploadError } = await supabase.storage
      .from("produtos")
      .upload(caminho, arquivo, { upsert: true });

    if (uploadError) {
      console.error("Erro ao enviar imagem:", uploadError);
      alert("Erro ao enviar imagem!");
      return;
    }

    // Gera URL pública
    const { data } = supabase.storage.from("produtos").getPublicUrl(caminho);
    const urlPublica = data.publicUrl;

    // Atualiza o produto no banco
    await supabase
      .from("produtos")
      .update({ imagem: urlPublica })
      .eq("id", produto.id);

    setProdutos((prev) =>
      prev.map((p) => (p.id === produto.id ? { ...p, imagem: urlPublica } : p))
    );
  }

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
        🩺 Painel Administrativo — IA Drogarias
      </h1>

      {/* 🔍 Busca */}
      <input
        type="text"
        placeholder="Buscar produto..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      {/* ➕ Novo produto */}
      <div className="bg-gray-100 p-4 rounded mb-6 flex gap-2 items-center">
        <input
          type="text"
          placeholder="Nome"
          value={novoProduto.nome}
          onChange={(e) =>
            setNovoProduto({ ...novoProduto, nome: e.target.value })
          }
          className="border p-2 rounded w-1/4"
        />
        <input
          type="text"
          placeholder="Categoria"
          value={novoProduto.categoria}
          onChange={(e) =>
            setNovoProduto({ ...novoProduto, categoria: e.target.value })
          }
          className="border p-2 rounded w-1/4"
        />
        <input
          type="number"
          placeholder="Preço"
          value={novoProduto.preco_venda}
          onChange={(e) =>
            setNovoProduto({
              ...novoProduto,
              preco_venda: parseFloat(e.target.value),
            })
          }
          className="border p-2 rounded w-1/6"
        />
        <input
          type="number"
          placeholder="Estoque"
          value={novoProduto.estoque}
          onChange={(e) =>
            setNovoProduto({
              ...novoProduto,
              estoque: parseInt(e.target.value),
            })
          }
          className="border p-2 rounded w-1/6"
        />
        <button
          onClick={adicionarProduto}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          + Adicionar Produto
        </button>
      </div>

      {/* 📦 Tabela */}
      {carregando ? (
        <p>Carregando produtos...</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-2">Imagem</th>
              <th className="p-2">Nome</th>
              <th className="p-2">Categoria</th>
              <th className="p-2">Preço</th>
              <th className="p-2">Estoque</th>
              <th className="p-2">Disponível</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map((p) => (
              <tr key={p.id} className="border-b text-center">
                <td className="p-2">
                  {p.imagem ? (
                    <img
                      src={p.imagem}
                      alt={p.nome}
                      className="w-12 h-12 mx-auto rounded"
                    />
                  ) : (
                    <span>—</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const arquivo = e.target.files?.[0];
                      if (arquivo) uploadImagem(p, arquivo);
                    }}
                    className="mt-1 text-xs"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={p.nome}
                    onChange={(e) =>
                      atualizarProduto(p.id, "nome", e.target.value)
                    }
                    className="border p-1 rounded w-full text-sm"
                  />
                </td>
                <td className="p-2">{p.categoria}</td>
                <td className="p-2">
                  <input
                    type="number"
                    value={p.preco_venda}
                    onChange={(e) =>
                      atualizarProduto(p.id, "preco_venda", e.target.value)
                    }
                    className="border p-1 rounded w-20 text-sm"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={p.estoque}
                    onChange={(e) =>
                      atualizarProduto(p.id, "estoque", e.target.value)
                    }
                    className="border p-1 rounded w-20 text-sm"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={p.disponivel}
                    onChange={(e) =>
                      atualizarProduto(p.id, "disponivel", e.target.checked)
                    }
                  />
                </td>
                <td className="p-2 text-sm text-gray-600">✔️</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}