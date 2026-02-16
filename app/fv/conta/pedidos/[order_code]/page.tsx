"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Order = {
  id: string;
  order_code: string;
  status: string | null;
  pagamento_metodo: string | null;
  pagamento_status: string | null;
  total_centavos: number | null;
  items: any[] | null;
  endereco: any | null;
  created_at: string;
  updated_at: string | null;
};

function brlFromCents(cents: any) {
  const v = (Number(cents || 0) / 100) || 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function badgeStatus(s?: string | null) {
  const v = (s || "").toUpperCase();
  if (v === "ENTREGUE") return "bg-emerald-100 text-emerald-900";
  if (v === "ENVIADO") return "bg-blue-100 text-blue-900";
  if (v === "SEPARANDO") return "bg-amber-100 text-amber-900";
  if (v === "CANCELADO") return "bg-red-100 text-red-900";
  if (v === "PAGO") return "bg-emerald-50 text-emerald-800";
  return "bg-slate-100 text-slate-900";
}

export default function PedidoDetalhePage() {
  const router = useRouter();
  const params = useParams();

  const orderCode = useMemo(() => String((params as any)?.order_code || ""), [params]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const { data } = await supabase.auth.getUser();
        const u = data?.user;
        if (!u) {
          router.replace(`/fv/entrar?next=${encodeURIComponent(`/fv/conta/pedidos/${orderCode}`)}`);
          return;
        }

        const { data: row, error } = await supabase
          .from("fv_orders")
          .select("id,order_code,status,pagamento_metodo,pagamento_status,total_centavos,items,endereco,created_at,updated_at")
          .eq("user_id", u.id)
          .eq("order_code", orderCode)
          .maybeSingle();

        if (error) throw error;
        if (!row) throw new Error("Pedido não encontrado.");

        if (!cancelled) setOrder(row as any);
      } catch (e: any) {
        if (!cancelled) setErr(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, orderCode]);

  const items = useMemo(() => (Array.isArray(order?.items) ? order?.items : []), [order]);

  if (loading) return <div className="p-6">Carregando…</div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold">Detalhe do pedido</h1>
          <Link className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50" href="/fv/conta/pedidos">
            Voltar
          </Link>
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-wrap">
            {err}
          </div>
        ) : null}

        {order ? (
          <>
            <section className="mt-6 rounded-2xl border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold">{order.order_code}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    Criado em {new Date(order.created_at).toLocaleString("pt-BR")}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-extrabold">{brlFromCents(order.total_centavos)}</div>
                  <div className="mt-1 flex justify-end gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeStatus(order.status)}`}>
                      {(order.status || "NOVO").toUpperCase()}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">
                      {(order.pagamento_status || "PENDENTE").toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Pagamento: {(order.pagamento_metodo || "—").toUpperCase()}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border bg-white p-4">
              <div className="text-sm font-extrabold">Itens</div>

              {items.length === 0 ? (
                <div className="mt-3 text-sm text-slate-600">Sem itens.</div>
              ) : (
                <div className="mt-3 grid gap-2">
                  {items.map((it: any, idx: number) => {
                    const name = String(it?.name || it?.nome || "Item");
                    const qty = Number(it?.quantity ?? it?.qtd ?? 1) || 1;
                    const unit = Number(it?.unit_amount ?? it?.preco_centavos ?? 0) || 0;
                    const subtotal = unit * qty;

                    return (
                      <div key={idx} className="flex items-center justify-between rounded-xl border p-3 text-sm">
                        <div>
                          <div className="font-semibold">{name}</div>
                          <div className="text-xs text-slate-600">
                            {qty}x • {brlFromCents(unit)}
                          </div>
                        </div>
                        <div className="font-extrabold">{brlFromCents(subtotal)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-6 rounded-2xl border bg-white p-4">
              <div className="text-sm font-extrabold">Entrega</div>

              {order.endereco ? (
                <div className="mt-3 rounded-xl border p-3 text-sm text-slate-800 whitespace-pre-wrap">
                  {JSON.stringify(order.endereco, null, 2)}
                </div>
              ) : (
                <div className="mt-3 text-sm text-slate-600">Endereço não registrado no pedido.</div>
              )}
            </section>

            <section className="mt-6 rounded-2xl border bg-white p-4">
              <div className="text-sm font-extrabold">Linha do tempo</div>
              <div className="mt-3 text-sm text-slate-700">
                Status atual:{" "}
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${badgeStatus(order.status)}`}>
                  {(order.status || "NOVO").toUpperCase()}
                </span>
                <div className="mt-2 text-xs text-slate-600">
                  Atualizado em {new Date(order.updated_at || order.created_at).toLocaleString("pt-BR")}
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
