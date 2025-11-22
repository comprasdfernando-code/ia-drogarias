"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Produto = {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  imagem?: string;
};

export default function AdminGigante() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [imagem, setImagem] = useState("");

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from("gigante_produtos")
      .select("*")
      .order("nome");

    if (!error && data) setProdutos(data);
    setLoading(false);
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function adicionar() {
    if (!nome || !preco || !estoque) {
      alert("Preencha todos os campos");
      return;
    }

    const { error } = await supabase.from("gigante_produtos").insert({
      nome,
      preco: parseFloat(preco),
      estoque: parseInt(estoque),
      imagem,
    });

    if (!error) {
      setNome("");
      setPreco("");
      setEstoque("");
      setImagem("");
      carregarProdutos();
    }
  }

  async function atualizar(id: string, campo: keyof Produto, valor: any) {
    await supabase
      .from("gigante_produtos")
      .update({ [campo]: valor })
      .eq("id", id);

    carregarProdutos();
  }

  async function deletar(id: string) {
    if (!confirm("Tem certeza que deseja excluir?")) return;

    await supabase.from("gigante_produtos").delete().eq("id", id);

    carregarProdutos();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">⚙️ Admin — Gigante dos Assados</h1>

      {/* ADICIONAR PRODUTO */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">Adicionar Produto</h2>

        <div className="grid grid-cols-4 gap-3">
          <input
            placeholder="Nome"
            className="border p-2 rounded"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <input
            placeholder="Preço"
            className="border p-2 rounded"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
          />

          <input
            placeholder="Estoque"
            className="border p-2 rounded"
            value={estoque}
            onChange={(e) => setEstoque(e.target.value)}
          />

          <input
            placeholder="URL da imagem"
            className="border p-2 rounded"
            value={imagem}
            onChange={(e) => setImagem(e.target.value)}
          />
        </div>

        <button
          onClick={adicionar}
          className="bg-green-600 mt-3 text-white px-4 py-2 rounded font-bold"
        >
          ➕ Cadastrar
        </button>
      </div>

      {/* LISTAGEM */}
      <h2 className="text-2xl font-bold mt-6 mb-4">📦 Produtos</h2>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        produtos.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded shadow mb-4">
            <div className="font-bold text-lg">{p.nome}</div>

            <div className="grid grid-cols-4 gap-4 mt-2">
              {/* Preço */}
              <div>
                <label>Preço</label>
                <input
                  type="number"
                  className="border p-2 w-full rounded"
                  value={p.preco}
                  onChange={(e) =>
                    atualizar(p.id, "preco", parseFloat(e.target.value))
                  }
                />
              </div>

              {/* Estoque */}
              <div>
                <label>Estoque</label>
                <input
                  type="number"
                  className="border p-2 w-full rounded"
                  value={p.estoque}
                  onChange={(e) =>
                    atualizar(p.id, "estoque", parseInt(e.target.value))
                  }
                />
              </div>

              {/* Imagem */}
              <div>
                <label>Imagem</label>
                <input
                  className="border p-2 w-full rounded"
                  value={p.imagem || ""}
                  onChange={(e) => atualizar(p.id, "imagem", e.target.value)}
                />
              </div>

              {/* Excluir */}
              <div className="flex items-end">
                <button
                  onClick={() => deletar(p.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded w-full"
                >
                  🗑 Excluir
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
