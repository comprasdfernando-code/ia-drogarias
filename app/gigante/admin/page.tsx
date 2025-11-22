"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminGigante() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Campos do formulário novo produto
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);

  async function carregar() {
    const { data, error } = await supabase
      .from("gigante_produtos")
      .select("*")
      .order("nome");

    if (!error) setProdutos(data || []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  // Upload imagem
  async function uploadImagem() {
    if (!imagem) return null;

    const nomeArquivo = `produto-${Date.now()}.${imagem.name.split(".").pop()}`;

    const { data, error } = await supabase.storage
      .from("gigante")
      .upload(nomeArquivo, imagem);

    if (error) {
      alert("Erro ao enviar imagem");
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("gigante")
      .getPublicUrl(nomeArquivo);

    return urlData.publicUrl;
  }

  // Criar produto novo
  async function criarProduto() {
    if (!nome || !preco) {
      alert("Nome e preço são obrigatórios!");
      return;
    }

    const urlImagem = await uploadImagem();

    const { error } = await supabase.from("gigante_produtos").insert({
      nome,
      categoria,
      preco: Number(preco),
      estoque: Number(estoque || 0),
      imagem_url: urlImagem || null,
      ativo: true,
    });

    if (error) {
      console.log(error);
      alert("Erro ao salvar produto!");
      return;
    }

    setNome("");
    setCategoria("");
    setPreco("");
    setEstoque("");
    setImagem(null);

    carregar();
    alert("Produto criado com sucesso!");
  }

  // Atualizar produto existente
  async function atualizarProduto(id: string, preco: number, estoque: number) {
    await supabase
      .from("gigante_produtos")
      .update({ preco, estoque })
      .eq("id", id);

    carregar();
  }

  if (loading) return <p className="p-4">Carregando...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">

      <h1 className="text-3xl font-bold mb-6">🛠 Administração — Produtos</h1>

      {/* FORM NOVO PRODUTO */}
      <div className="bg-white p-5 rounded-lg shadow mb-10">
        <h2 className="text-xl font-bold mb-4">➕ Criar Produto</h2>

        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome"
          className="border p-2 rounded w-full mb-2"
        />

        <input
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          placeholder="Categoria"
          className="border p-2 rounded w-full mb-2"
        />

        <input
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          placeholder="Preço"
          type="number"
          className="border p-2 rounded w-full mb-2"
        />

        <input
          value={estoque}
          onChange={(e) => setEstoque(e.target.value)}
          placeholder="Estoque"
          type="number"
          className="border p-2 rounded w-full mb-2"
        />

        {/* TIRAR FOTO OU ESCOLHER */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setImagem(e.target.files?.[0] || null)}
          className="border p-2 rounded w-full mb-3"
        />

        <button
          onClick={criarProduto}
          className="w-full bg-green-600 text-white p-3 rounded font-bold"
        >
          Criar Produto
        </button>
      </div>

      {/* LISTAGEM E EDIÇÃO */}
      {produtos.map((p) => (
        <div
          key={p.id}
          className="bg-white p-4 mb-4 rounded shadow flex flex-col gap-3"
        >
          <h2 className="font-bold text-xl">{p.nome}</h2>

          {p.imagem_url && (
            <img
              src={p.imagem_url}
              alt="img"
              className="w-32 h-32 object-cover rounded"
            />
          )}

          <label>
            Preço:
            <input
              type="number"
              defaultValue={p.preco}
              className="border p-2 w-full"
              onBlur={(e) =>
                atualizarProduto(p.id, Number(e.target.value), p.estoque)
              }
            />
          </label>

          <label>
            Estoque:
            <input
              type="number"
              defaultValue={p.estoque}
              className="border p-2 w-full"
              onBlur={(e) =>
                atualizarProduto(p.id, p.preco, Number(e.target.value))
              }
            />
          </label>
        </div>
      ))}
    </div>
  );
}
