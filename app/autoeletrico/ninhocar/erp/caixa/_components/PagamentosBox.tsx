"use client";

import { supabase } from "@/lib/supabaseClient";

export default function PagamentosBox({ comanda, caixaId, onUpdate }: any) {
  async function pagar(forma: string) {
    await supabase.from("ae_pagamentos").insert({
      empresa_id: comanda.empresa_id,
      comanda_id: comanda.id,
      caixa_id: caixaId,
      forma,
      valor: comanda.total,
    });

    const { data } = await supabase
      .from("ae_comandas")
      .update({ status: "fechada" })
      .eq("id", comanda.id)
      .select()
      .single();

    if (data) onUpdate(data);
  }

  return (
    <div className="bg-white rounded shadow p-4 space-y-2">
      <h2 className="font-semibold">Pagamento</h2>

      <div className="flex gap-2">
        {["dinheiro", "pix", "debito", "credito"].map((f) => (
          <button
            key={f}
            onClick={() => pagar(f)}
            className="flex-1 bg-green-600 text-white py-2 rounded"
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
