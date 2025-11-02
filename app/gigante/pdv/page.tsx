"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function PDVGigante() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [pagamento, setPagamento] = useState("pix");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("produtos")
        .select("*")
        .eq("loja", "gigante")
        .eq("disponivel", true);
      setProdutos(data || []);
    })();
  }, []);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return produtos.filter((p) => p.nome.toLowerCase().includes(q));
  }, [busca, produtos]);

  function add(p: any) {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === p.id);
      if (existe)
        return prev.map((i) =>
          i.id === p.id ? { ...i, qtd: i.qtd + 1 } : i
        );
      return [...prev, { ...p, qtd: 1 }];
    });
  }

  const total = carrinho.reduce((acc, i) => acc + i.qtd * i.preco_venda, 0);

  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ color: "#C8102E" }}>🧾 PDV — Gigante</h1>

      <input
        placeholder="Buscar produto..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          margin: "10px 0",
          border: "1px solid #ccc",
        }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {filtrados.map((p) => (
          <button
            key={p.id}
            onClick={() => add(p)}
            style={{
              background: "#C8102E",
              color: "#fff",
              padding: 10,
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {p.nome} — R$ {p.preco_venda?.toFixed(2)}
          </button>
        ))}
      </div>

      <hr style={{ margin: "20px 0" }} />
      <h3>Total: R$ {total.toFixed(2)}</h3>
      <p>Pagamento: {pagamento}</p>
    </main>
  );
}