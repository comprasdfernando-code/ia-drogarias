"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Produto = {
  id: string;
  nome: string;
  preco: number;
  categoria?: string;
  estoque?: number;
  ativo: boolean;
};

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    setLoading(true);

    const { data, error } = await supabase
      .from("gigante_produtos")
      .select("*")
      .order("nome", { ascending: true });

    if (!error) setProdutos(data as Produto[]);
    setLoading(false);
  }

  async function salvarAlteracao(
    id: string,
    campo: string,
    valor: string | number | boolean
  ) {
    await supabase.from("gigante_produtos").update({ [campo]: valor }).eq("id", id);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🛠️ Administração — Produtos</h1>

      {loading && <p>Carregando produtos...</p>}

      <div className="space-y-4">
        {produtos.map((p) => (
          <div
            key={p.id}
            className="bg-white p-4 shadow rounded-lg border flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            {/* Nome */}
            <input
              className="border p-2 rounded w-full md:w-48"
              value={p.nome}
              onChange={(e) => {
                const value = e.target.value;
                setProdutos((prev) =>
                  prev.map((x) => (x.id === p.id ? { ...x, nome: value } : x))
                );
                salvarAlteracao(p.id, "nome", value);
              }}
            />

            {/* Preço */}
            <input
              type="number"
              className="border p-2 rounded w-full md:w-24"
              value={p.preco}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setProdutos((prev) =>
                  prev.map((x) => (x.id === p.id ? { ...x, preco: value } : x))
                );
                salvarAlteracao(p.id, "preco", value);
              }}
            />

            {/* Estoque */}
            <input
              type="number"
              className="border p-2 rounded w-full md:w-24"
              value={p.estoque ?? 0}
              onChange={async (e) => {
                const value = Number(e.target.value);

                setProdutos((prev) =>
                  prev.map((x) =>
                    x.id === p.id ? { ...x, estoque: value } : x
                  )
                );

                await salvarAlteracao(p.id, "estoque", value);
              }}
            />

            {/* Ativo */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={p.ativo}
                onChange={(e) => {
                  const value = e.target.checked;

                  setProdutos((prev) =>
                    prev.map((x) =>
                      x.id === p.id ? { ...x, ativo: value } : x
                    )
                  );

                  salvarAlteracao(p.id, "ativo", value);
                }}
              />
              <span>{p.ativo ? "Ativo" : "Inativo"}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
