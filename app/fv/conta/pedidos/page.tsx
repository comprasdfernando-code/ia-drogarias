"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type OrderRow = {
  id: string;
  order_code: string;
  status: string | null;
  pagamento_metodo: string | null;
  pagamento_status: string | null;
  total_centavos: number | null;
  created_at: string;
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

export default function PedidosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const { data } = await supabase.auth.getUser();
        const u = data?.user;
        if (!u) {
          router.replace(`/fv/entrar?next=${encodeURIComponent("/fv/conta/pedidos")}`);
          return;
        }

        const { data: rows, error } = await supabase
          .from("fv_orders")
          .select("id,order_code,status,pagamento_metodo,pagamento_status,total_centavos,created_at")
          .eq("user_id", u.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!cancelled) setOrders((rows as any) || []);
      } catch (e: any) {
        if (!cancelled) setErr(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const hasOrders = useMemo(() => orders.length > 0, [orders]);

  if (loading) return <div className="p-6">Carregando…</div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold">Meus pedidos</h1>
          <Link className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50" href="/fv/conta">
            Voltar
          </Link>
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-wrap">
            {err}
          </div>
        ) : null}

        {!hasOrders ? (
          <div className="mt-6 rounded-2xl border bg-white p-4 text-sm text-slate-600">
            Você ainda não tem pedidos. Volte para a loja e finalize uma compra.
            <div className="mt-3">
              <Link className="inline-flex rounded-xl bg-black px-4 py-2 text-white font-extrabold" href="/fv">
                Ir para /fv
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/fv/conta/pedidos/${encodeURIComponent(o.order_code)}`}
                className="rounded-2xl border bg-white p-4 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold">{o.order_code}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-extrabold">{brlFromCents(o.total_centavos)}</div>
                    <div className="mt-1 flex justify-end gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeStatus(o.status)}`}>
                        {(o.status || "NOVO").toUpperCase()}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">
                        {(o.pagamento_status || "PENDENTE").toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-600">
                  Pagamento: {(o.pagamento_metodo || "—").toUpperCase()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
