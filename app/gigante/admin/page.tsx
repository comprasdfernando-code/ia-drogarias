"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminGigante() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from("gigante_produtos")
      .select("*")
      .order("nome");

    if (error) console.log(error);
    else setProdutos(data || []);

    setLoading(false);
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function atualizarProduto(id: string, preco: number, estoque: number) {
    await supabase
      .from("gigante_produtos")
      .update({ preco, estoque })
      .eq("id", id);

    carregarProdutos();
  }

  if (loading) return <p className="p-4">Carregando...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🛠 Administração — Produtos</h1>

      {produtos.map((p) => (
        <div
          key={p.id}
          className="bg-white p-4 mb-3 rounded shadow flex flex-col gap-3"
        >
          <h2 className="font-bold text-xl">{p.nome}</h2>

          <label>
            Preço:
            <input
              type="number"
              defaultValue={p.preco}
              step="0.01"
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
