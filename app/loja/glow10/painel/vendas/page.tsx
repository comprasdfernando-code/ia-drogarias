"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import HeaderPremium from "../../_components/HeaderPremium";

type Venda = {
  id: string;
  created_at: string;
  status: string;
  cliente_nome: string | null;
  cliente_whatsapp: string | null;
  total: number;
};

function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PainelVendasGlow10() {
  const [vendas, setVendas] = useState<Venda[]>([]);

  async function load() {
    const { data } = await supabase
      .from("mk_vendas")
      .select("id,created_at,status,cliente_nome,cliente_whatsapp,total")
      .order("created_at", { ascending: false })
      .limit(200);

    setVendas((data as any) || []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, []);

  async function enviarCaixa(venda_id: string) {
    await supabase
      .from("mk_vendas")
      .update({ status: "ENVIADA_CAIXA", enviado_caixa_at: new Date().toISOString() })
      .eq("id", venda_id);

    load();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderPremium />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-semibold">Painel de Vendas • Glow10</h1>
        <p className="text-white/70 mt-1">Vendas criadas pela Home → enviar pro Caixa confirmar pagamento.</p>

        <div className="mt-6 space-y-3">
          {vendas.map((v) => (
            <div key={v.id} className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-white/60">{new Date(v.created_at).toLocaleString("pt-BR")}</div>
                  <div className="font-semibold">Venda #{v.id.slice(0, 8)}</div>
                  <div className="text-white/70">
                    Cliente: {v.cliente_nome || "-"} {v.cliente_whatsapp ? `(${v.cliente_whatsapp})` : ""}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-white/60 text-sm">Status</div>
                  <div className="font-semibold">{v.status}</div>
                  <div className="text-xl font-bold mt-1">{brl(v.total)}</div>

                  <button
                    disabled={v.status !== "CRIADA"}
                    onClick={() => enviarCaixa(v.id)}
                    className="mt-2 rounded-2xl bg-white px-4 py-2 font-semibold text-black disabled:opacity-40"
                  >
                    Enviar pro Caixa
                  </button>
                </div>
              </div>
            </div>
          ))}

          {vendas.length === 0 && <div className="text-white/70">Sem vendas.</div>}
        </div>
      </div>
    </div>
  );
}
