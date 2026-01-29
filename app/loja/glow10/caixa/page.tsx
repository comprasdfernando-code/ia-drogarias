"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import HeaderPremium from "../_components/HeaderPremium";

type Venda = {
  id: string;
  created_at: string;
  status: string;
  total: number;
};

function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CaixaGlow10() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [forma, setForma] = useState("PIX");

  async function load() {
    const { data } = await supabase
      .from("mk_vendas")
      .select("id,created_at,status,total")
      .in("status", ["ENVIADA_CAIXA"])
      .order("created_at", { ascending: false })
      .limit(200);

    setVendas((data as any) || []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, []);

  async function confirmarPagamento(venda_id: string, valor: number) {
    // registra pagamento
    const { error: p1 } = await supabase.from("mk_caixa_pagamentos").upsert({
      venda_id,
      forma,
      valor,
      confirmado: true,
      confirmado_at: new Date().toISOString(),
    });
    if (p1) return alert(p1.message);

    // marca venda paga e finaliza
    const { error: p2 } = await supabase
      .from("mk_vendas")
      .update({
        status: "FINALIZADA",
        pago_at: new Date().toISOString(),
        finalizado_at: new Date().toISOString(),
      })
      .eq("id", venda_id);

    if (p2) return alert(p2.message);

    load();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderPremium />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-semibold">Caixa • Glow10</h1>
        <p className="text-white/70 mt-1">Confirme pagamentos das vendas enviadas pelo Painel.</p>

        <div className="mt-4 flex items-center gap-3">
          <div className="text-white/70">Forma padrão:</div>
          <select
            value={forma}
            onChange={(e) => setForma(e.target.value)}
            className="rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/10 outline-none"
          >
            <option value="PIX">PIX</option>
            <option value="CARTAO">CARTAO</option>
            <option value="DINHEIRO">DINHEIRO</option>
            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
          </select>
        </div>

        <div className="mt-6 space-y-3">
          {vendas.map((v) => (
            <div key={v.id} className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-white/60">{new Date(v.created_at).toLocaleString("pt-BR")}</div>
                  <div className="font-semibold">Venda #{v.id.slice(0, 8)}</div>
                  <div className="text-white/70">Status: {v.status}</div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold">{brl(v.total)}</div>
                  <button
                    onClick={() => confirmarPagamento(v.id, v.total)}
                    className="mt-2 rounded-2xl bg-white px-4 py-2 font-semibold text-black"
                  >
                    Confirmar pagamento
                  </button>
                </div>
              </div>
            </div>
          ))}

          {vendas.length === 0 && <div className="text-white/70">Nenhuma venda pendente no caixa.</div>}
        </div>
      </div>
    </div>
  );
}
