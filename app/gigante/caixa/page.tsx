"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function CaixaGigante() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      const hoje = new Date();
      const inicio = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate(),
        0,
        0,
        0
      );
      const { data } = await supabase
        .from("pedidos")
        .select("*")
        .eq("loja", "gigante")
        .gte("created_at", inicio.toISOString());

      setPedidos(data || []);
      setTotal(
        data?.reduce((acc: number, p: any) => acc + (p.total || 0), 0) || 0
      );
    })();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ color: "#C8102E" }}>📦 Fechamento de Caixa — Gigante</h1>
      <h2 style={{ marginBottom: 20 }}>
        Total do dia: <b>R$ {total.toFixed(2)}</b>
      </h2>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Hora</th>
            <th>Pagamento</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id}>
              <td>{new Date(p.created_at).toLocaleTimeString()}</td>
              <td>{p.pagamento}</td>
              <td>R$ {p.total?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}