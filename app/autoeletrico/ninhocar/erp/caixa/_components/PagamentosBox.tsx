"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function brl(v: any) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PagamentosBox({
  comanda,
  caixaId,
  onUpdate,
}: {
  comanda: any;
  caixaId: string;
  onUpdate: (c: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  async function finalizar(forma: string) {
    setErro("");
    setOk("");

    if (!comanda?.id) return;

    setLoading(true);
    try {
      // 1) registra pagamento
      const { error: e1 } = await supabase.from("ae_pagamentos").insert({
        empresa_id: comanda.empresa_id,
        comanda_id: comanda.id,
        caixa_id: caixaId,
        forma,
        valor: Number(comanda.total || 0),
        status: "confirmado",
      });

      if (e1) throw e1;

      // 2) fecha comanda (trigger baixa estoque)
      const { data: c2, error: e2 } = await supabase
        .from("ae_comandas")
        .update({ status: "fechada" })
        .eq("id", comanda.id)
        .select()
        .single();

      if (e2) throw e2;

      onUpdate(c2);
      setOk(`✅ Venda finalizada (${forma.toUpperCase()}). ${brl(c2.total)}`);
    } catch (e: any) {
      console.error(e);
      setErro(e?.message || "Erro ao finalizar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Finalizar venda</h2>
        <div className="text-sm text-slate-300">
          Total: <b className="text-slate-100">{brl(comanda.total)}</b>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {["dinheiro", "pix", "debito", "credito"].map((f) => (
          <button
            key={f}
            onClick={() => finalizar(f)}
            disabled={loading || comanda.status === "fechada"}
            className="rounded-lg px-3 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {erro && (
        <div className="text-sm text-red-300 bg-red-950/30 border border-red-900 rounded-lg p-2">
          {erro}
        </div>
      )}
      {ok && (
        <div className="text-sm text-emerald-200 bg-emerald-950/30 border border-emerald-900 rounded-lg p-2">
          {ok}
        </div>
      )}

      {comanda.status === "fechada" && (
        <div className="text-xs text-slate-400">
          Comanda fechada. Estoque já foi baixado.
        </div>
      )}
    </div>
  );
}
