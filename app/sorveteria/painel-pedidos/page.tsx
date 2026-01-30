"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Pedido = {
  id: string;
  created_at: string;
  codigo: string;
  status: string;
  cliente_nome: string | null;
  bairro: string | null;
  endereco: string | null;
  pagamento: string | null;
  obs: string | null;
  total: number;
};

type Item = {
  id: string;
  pedido_id: string;
  nome: string;
  sabor: string | null;
  qty: number;
  preco: number;
  subtotal: number;
};

const STATUS = ["novo", "separando", "saiu_entrega", "entregue", "cancelado"];

function brl(v: any) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dtBR(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

export default function PainelPedidosSorveteria() {
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selected, setSelected] = useState<Pedido | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [fStatus, setFStatus] = useState<string>("todos");
  const [q, setQ] = useState("");

  async function loadPedidos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sorveteria_pedidos_view")
      .select("id,created_at,codigo,status,cliente_nome,bairro,endereco,pagamento,obs,total")
      .order("created_at", { ascending: false })
      .limit(300);

    if (!error) setPedidos((data ?? []) as any);
    setLoading(false);
  }

  async function loadItens(pedidoId: string) {
    const { data, error } = await supabase
      .from("sorveteria_pedido_itens")
      .select("id,pedido_id,nome,sabor,qty,preco,subtotal")
      .eq("pedido_id", pedidoId)
      .order("created_at", { ascending: true });

    if (!error) setItens((data ?? []) as any);
  }

  useEffect(() => {
    loadPedidos();

    // realtime (opcional, mas top)
    const ch = supabase
      .channel("sorveteria_pedidos_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sorveteria_pedidos" }, () => {
        loadPedidos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const filtrados = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return pedidos.filter((p) => {
      const okStatus = fStatus === "todos" || (p.status || "").toLowerCase() === fStatus;
      const blob =
        `${p.codigo} ${p.cliente_nome ?? ""} ${p.bairro ?? ""} ${p.endereco ?? ""} ${p.pagamento ?? ""}`.toLowerCase();
      const okQ = !qq || blob.includes(qq);
      return okStatus && okQ;
    });
  }, [pedidos, fStatus, q]);

  async function setStatus(pedidoId: string, status: string) {
    const { error } = await supabase.from("sorveteria_pedidos").update({ status }).eq("id", pedidoId);
    if (!error) {
      setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? { ...p, status } : p)));
      if (selected?.id === pedidoId) setSelected({ ...(selected as any), status } as any);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900">Painel de Pedidos — Sorveteria</h1>
            <p className="text-neutral-600">Acompanhe pedidos do site e atualize o status.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por código, cliente, bairro..."
              className="px-3 py-2 border rounded-lg w-full sm:w-72"
            />
            <select
              value={fStatus}
              onChange={(e) => setFStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="todos">Todos</option>
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              onClick={loadPedidos}
              className="px-4 py-2 rounded-lg bg-neutral-900 text-white font-semibold"
            >
              Atualizar
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LISTA */}
          <div className="lg:col-span-2 bg-white border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-semibold text-neutral-900">Pedidos</div>
              <div className="text-sm text-neutral-500">{filtrados.length} encontrados</div>
            </div>

            {loading ? (
              <div className="p-6 text-neutral-500">Carregando…</div>
            ) : filtrados.length === 0 ? (
              <div className="p-6 text-neutral-500">Nenhum pedido.</div>
            ) : (
              <div className="divide-y">
                {filtrados.map((p) => (
                  <button
                    key={p.id}
                    onClick={async () => {
                      setSelected(p);
                      await loadItens(p.id);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-neutral-50 ${
                      selected?.id === p.id ? "bg-neutral-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-neutral-900">{p.codigo}</div>
                        <div className="text-sm text-neutral-700">
                          {p.cliente_nome ?? "Sem nome"} • {p.bairro ?? "—"}
                        </div>
                        <div className="text-xs text-neutral-500">{dtBR(p.created_at)}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-semibold">{brl(p.total)}</div>
                        <div className="text-xs px-2 py-1 inline-block rounded-full border">
                          {p.status}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DETALHE */}
          <div className="bg-white border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b">
              <div className="font-semibold text-neutral-900">Detalhes</div>
              <div className="text-sm text-neutral-500">Selecione um pedido na lista.</div>
            </div>

            {!selected ? (
              <div className="p-6 text-neutral-500">Nenhum pedido selecionado.</div>
            ) : (
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-lg font-extrabold">{selected.codigo}</div>
                  <div className="text-sm text-neutral-600">{dtBR(selected.created_at)}</div>
                </div>

                <div className="space-y-1 text-sm">
                  <div><span className="font-semibold">Cliente:</span> {selected.cliente_nome ?? "—"}</div>
                  <div><span className="font-semibold">Endereço:</span> {selected.endereco ?? "—"}</div>
                  <div><span className="font-semibold">Bairro:</span> {selected.bairro ?? "—"}</div>
                  <div><span className="font-semibold">Pagamento:</span> {selected.pagamento ?? "—"}</div>
                  {selected.obs ? <div><span className="font-semibold">Obs:</span> {selected.obs}</div> : null}
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-neutral-50 text-sm font-semibold">Itens</div>
                  <div className="divide-y">
                    {itens.map((i) => (
                      <div key={i.id} className="px-3 py-2 text-sm">
                        <div className="font-semibold text-neutral-900">
                          {i.nome}{i.sabor ? ` (${i.sabor})` : ""}
                        </div>
                        <div className="text-neutral-600">
                          {brl(i.preco)} x {i.qty} = <span className="font-semibold">{brl(i.subtotal)}</span>
                        </div>
                      </div>
                    ))}
                    {itens.length === 0 ? <div className="px-3 py-3 text-sm text-neutral-500">Sem itens.</div> : null}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-lg">{brl(selected.total)}</div>
                  <select
                    value={selected.status}
                    onChange={(e) => setStatus(selected.id, e.target.value)}
                    className="px-3 py-2 border rounded-lg"
                  >
                    {STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-neutral-500">
          Dica: depois a gente coloca login e trava o painel (RLS + Supabase Auth) pra ninguém fora ver pedidos.
        </p>
      </div>
    </main>
  );
}
