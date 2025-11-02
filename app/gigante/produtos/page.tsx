"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function ProdutosGigante() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [form, setForm] = useState({ nome: "", preco_venda: 0 });

  async function carregar() {
    const { data } = await supabase
      .from("produtos")
      .select("*")
      .eq("loja", "gigante");
    setProdutos(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function adicionar() {
    if (!form.nome || !form.preco_venda) return alert("Preencha os campos");
    await supabase.from("produtos").insert({
      nome: form.nome,
      preco_venda: form.preco_venda,
      loja: "gigante",
      disponivel: true,
    });
    setForm({ nome: "", preco_venda: 0 });
    carregar();
  }

  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ color: "#C8102E" }}>🍗 Produtos — Gigante</h1>

      <input
        placeholder="Nome do produto"
        value={form.nome}
        onChange={(e) => setForm({ ...form, nome: e.target.value })}
        style={{ padding: 8, margin: "5px 0", width: "100%" }}
      />
      <input
        type="number"
        placeholder="Preço de venda"
        value={form.preco_venda}
        onChange={(e) =>
          setForm({ ...form, preco_venda: Number(e.target.value) })
        }
        style={{ padding: 8, margin: "5px 0", width: "100%" }}
      />
      <button
        onClick={adicionar}
        style={{
          background: "#C8102E",
          color: "#fff",
          padding: "10px 16px",
          border: "none",
          borderRadius: 4,
          marginTop: 10,
        }}
      >
        Adicionar
      </button>

      <ul style={{ marginTop: 20 }}>
        {produtos.map((p) => (
          <li key={p.id}>
            {p.nome} — R$ {p.preco_venda?.toFixed(2)}
          </li>
        ))}
      </ul>
    </main>
  );
}