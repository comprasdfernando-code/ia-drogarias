"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Produto = {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  ativo: boolean;
  imagem_url: string | null;
  categoria: string | null;
};

export default function AdminGigante() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoNome, setNovoNome] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novaImagem, setNovaImagem] = useState<File | null>(null);

  // ============================
  // 1) CARREGAR PRODUTOS
  // ============================
  async function carregarProdutos() {
    const { data } = await supabase
      .from("gigante_produtos")
      .select("*")
      .order("nome");

    const lista = (data || []).map((p: any) => ({
      ...p,
      preco: p.preco ?? 0,
      estoque: p.estoque ?? 0,
      ativo: p.ativo ?? true,
      categoria: p.categoria ?? "",
      imagem_url: p.imagem_url ?? null,
    }));

    setProdutos(lista);
    setLoading(false);
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  // ============================
  // 2) UPLOAD DE IMAGEM
  // ============================
  async function uploadImagem(file: File, produtoId: string) {
    const ext = file.name.split(".").pop();
    const filePath = `gigante/${produtoId}.${ext}`;

    await supabase.storage.from("gigante").upload(filePath, file, {
      upsert: true,
    });

    const urlPublica =
      supabase.storage.from("gigante").getPublicUrl(filePath).data.publicUrl;

    await supabase
      .from("gigante_produtos")
      .update({ imagem_url: urlPublica })
      .eq("id", produtoId);

    carregarProdutos();
  }

  // ============================
  // 3) ATUALIZA PRODUTO
  // ============================
  async function atualizarProduto(id: string, campos: any) {
    await supabase.from("gigante_produtos").update(campos).eq("id", id);
    carregarProdutos();
  }

  // ============================
  // 4) CRIAR NOVO PRODUTO
  // ============================
  async function criarProduto() {
    if (!novoNome.trim()) return alert("Digite o nome.");

    const { data, error } = await supabase
      .from("gigante_produtos")
      .insert({
        nome: novoNome,
        categoria: novaCategoria,
        preco: 0,
        estoque: 0,
        ativo: true,
      })
      .select()
      .single();

    if (error) return alert("Erro ao criar produto.");

    if (novaImagem) uploadImagem(novaImagem, data.id);

    setNovoNome("");
    setNovaCategoria("");
    setNovaImagem(null);

    carregarProdutos();
  }

  // ============================
  // 5) TIRAR FOTO PELA CÂMERA
  // ============================
  async function capturarCamera(produtoId: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // abre câmera traseira no celular
    input.onchange = () => {
      const file = (input.files as FileList)[0];
      uploadImagem(file, produtoId);
    };
    input.click();
  }

  // ============================
  // RENDERIZAÇÃO
  // ============================
  if (loading) return <p className="p-4">Carregando...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🛠 Administração — Produtos</h1>

      {/* ======================================
          FORM DE CRIAÇÃO
      ======================================= */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-bold mb-3">➕ Criar Produto</h2>

        <input
          placeholder="Nome do Produto"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          className="border p-2 w-full mb-2"
        />

        <input
          placeholder="Categoria"
          value={novaCategoria}
          onChange={(e) => setNovaCategoria(e.target.value)}
          className="border p-2 w-full mb-2"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setNovaImagem(e.target.files?.[0] || null)}
          className="border p-2 w-full mb-2"
        />

        <button
          onClick={criarProduto}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          Criar Produto
        </button>
      </div>

      {/* ======================================
          LISTA DE PRODUTOS
      ======================================= */}
      {produtos.map((p) => (
        <div key={p.id} className="bg-white p-4 mb-4 rounded shadow">
          <h2 className="text-xl font-bold">{p.nome}</h2>

          {p.imagem_url && (
            <img
              src={p.imagem_url}
              alt="Foto"
              className="w-32 h-32 object-cover rounded mb-2"
            />
          )}

          {/* ALTERAR IMAGEM */}
          <div className="flex gap-2 mb-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files?.[0] && uploadImagem(e.target.files[0], p.id)
              }
              className="border p-2 w-full"
            />

            <button
              onClick={() => capturarCamera(p.id)}
              className="bg-blue-600 text-white px-4 rounded"
            >
              📸 Câmera
            </button>
          </div>

          {/* PREÇO */}
          <label className="font-semibold">Preço:</label>
          <input
            type="number"
            defaultValue={p.preco}
            step="0.01"
            className="border p-2 w-full mb-3"
            onBlur={(e) =>
              atualizarProduto(p.id, { preco: Number(e.target.value) })
            }
          />

          {/* ESTOQUE */}
          <label className="font-semibold">Estoque:</label>
          <input
            type="number"
            defaultValue={p.estoque}
            className="border p-2 w-full mb-3"
            onBlur={(e) =>
              atualizarProduto(p.id, { estoque: Number(e.target.value) })
            }
          />

          {/* CATEGORIA */}
          <label className="font-semibold">Categoria:</label>
          <input
            type="text"
            defaultValue={p.categoria || ""}
            className="border p-2 w-full mb-3"
            onBlur={(e) =>
              atualizarProduto(p.id, { categoria: e.target.value })
            }
          />

          {/* ATIVO */}
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              defaultChecked={p.ativo}
              onChange={(e) =>
                atualizarProduto(p.id, { ativo: e.target.checked })
              }
            />
            Produto Ativo
          </label>
        </div>
      ))}
    </div>
  );
}
