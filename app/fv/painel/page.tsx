// app/fv/cupom/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function safeDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return String(iso);
  }
}
function parseItens(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const j = JSON.parse(raw);
      return Array.isArray(j) ? j : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function CupomFv() {
  const params = useParams();
  const id = String((params as any)?.id || "");

  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("fv_pedidos").select("*").eq("id", id).single();
      if (error) console.error(error);
      setP(data || null);
      setLoading(false);
    })();
  }, [id]);

  const itens = useMemo(() => parseItens(p?.itens), [p]);

  if (loading) return <div className="p-6">Carregando…</div>;
  if (!p) return <div className="p-6">Pedido não encontrado.</div>;

  const subtotal = Number(p.subtotal ?? 0);
  const taxa = Number(p.taxa_entrega ?? 0);
  const total = Number(p.total ?? 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white border rounded-2xl shadow-sm p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold">IA Drogarias • FV</div>
            <div className="text-xs text-gray-500">Cupom / Pedido</div>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl bg-gray-900 text-white font-extrabold"
          >
            🖨️ Imprimir
          </button>
        </div>

        <div className="mt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Pedido</span>
            <span className="font-mono font-bold">{String(p.id).slice(0, 10).toUpperCase()}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-500">Data</span>
            <span className="font-bold">{safeDate(p.created_at)}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-500">Status</span>
            <span className="font-bold">{String(p.status || "novo").toUpperCase()}</span>
          </div>
        </div>

        <div className="mt-4 border-t pt-3 text-sm">
          <div className="font-extrabold mb-2">Cliente</div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nome</span>
            <span className="font-bold">{p.cliente_nome || "—"}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-500">Whats</span>
            <span className="font-bold">{p.cliente_whatsapp || p.cliente_telefone || "—"}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-500">Entrega</span>
            <span className="font-bold">{String(p.tipo_entrega || "retirada").toUpperCase()}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-500">Pagamento</span>
            <span className="font-bold">{String(p.pagamento || "—").toUpperCase()}</span>
          </div>
        </div>

        <div className="mt-4 border-t pt-3">
          <div className="font-extrabold mb-2">Itens</div>
          {itens.length === 0 ? (
            <div className="text-sm text-gray-600">Sem itens.</div>
          ) : (
            <div className="space-y-2">
              {itens.map((it: any, idx: number) => {
                const qtd = Number(it.qtd ?? it.quantidade ?? 0);
                const preco = Number(it.preco ?? 0);
                const sub = Number(it.subtotal ?? (preco * qtd));
                return (
                  <div key={idx} className="flex justify-between text-sm">
                    <div className="min-w-0">
                      <div className="font-bold truncate">{qtd}x {it.nome || "—"}</div>
                      {it.ean ? <div className="text-xs text-gray-500 truncate">EAN: {it.ean}</div> : null}
                    </div>
                    <div className="font-extrabold">{brl(sub)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-extrabold">{brl(subtotal)}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-500">Taxa</span>
            <span className="font-extrabold">{brl(taxa)}</span>
          </div>
          <div className="flex justify-between mt-2 text-base">
            <span className="font-extrabold">Total</span>
            <span className="font-extrabold text-green-700">{brl(total)}</span>
          </div>
        </div>

        <div className="mt-4 text-[11px] text-gray-500 border-t pt-3">
          Obrigado! • IA Drogarias FV
        </div>
      </div>

      {/* CSS de impressão */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          button { display: none !important; }
          .bg-gray-50 { background: white !important; }
          .shadow-sm { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
