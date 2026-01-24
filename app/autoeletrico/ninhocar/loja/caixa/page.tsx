"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Comanda = {
  id: string;
  created_at: string;
  status: string;
  forma_pagamento?: string | null;
  observacao?: string | null;
  cliente_nome?: string | null;
  cliente_whatsapp?: string | null;
  subtotal: number;
  total: number;
};

type Item = {
  id: string;
  comanda_id: string;
  nome: string;
  qtd: number;
  preco: number;
  subtotal: number;
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString("pt-BR");
  } catch {
    return dt;
  }
}

export default function CaixaPage() {
  const [list, setList] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState("TODOS");
  const [q, setQ] = useState("");

  const [openId, setOpenId] = useState<string | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [loadingItens, setLoadingItens] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    setErr(null);

    let query = supabase
      .from("ninhocar_comandas")
      .select("id,created_at,status,forma_pagamento,observacao,cliente_nome,cliente_whatsapp,subtotal,total")
      .order("created_at", { ascending: false })
      .limit(200);

    if (status !== "TODOS") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) setErr(error.message);
    else setList((data || []) as any);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return list;

    return list.filter((c) => {
      return (
        c.id.toLowerCase().includes(qq) ||
        (c.cliente_nome || "").toLowerCase().includes(qq) ||
        (c.cliente_whatsapp || "").toLowerCase().includes(qq)
      );
    });
  }, [list, q]);

  async function open(comandaId: string) {
    setOpenId(comandaId);
    setItens([]);
    setLoadingItens(true);
    setErr(null);

    const { data, error } = await supabase
      .from("ninhocar_comanda_itens")
      .select("id,comanda_id,nome,qtd,preco,subtotal")
      .eq("comanda_id", comandaId)
      .order("created_at", { ascending: true });

    if (error) setErr(error.message);
    else setItens((data || []) as any);

    setLoadingItens(false);
  }

  async function setStatusComanda(comandaId: string, novo: string) {
    setMsg(null);
    setErr(null);

    const { error } = await supabase
      .from("ninhocar_comandas")
      .update({ status: novo })
      .eq("id", comandaId);

    if (error) setErr(error.message);
    else {
      setMsg(`Status atualizado: ${novo}`);
      await load();
      if (openId === comandaId) await open(comandaId);
    }
  }

  const resumo = useMemo(() => {
    const total = filtered.reduce((acc, c) => acc + Number(c.total || 0), 0);
    const qtd = filtered.length;
    return { qtd, total };
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-black text-gray-900">Caixa • Ninho Car</div>
            <div className="text-sm text-gray-600">Comandas da Loja</div>
          </div>

          <button onClick={load} className="px-4 py-2 rounded-xl border text-sm font-semibold">
            Atualizar
          </button>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por ID / nome / whatsapp..."
            className="w-full border rounded-xl px-3 py-2 text-sm md:col-span-2"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm"
          >
            <option value="TODOS">TODOS</option>
            <option value="ABERTA">ABERTA</option>
            <option value="PAGA">PAGA</option>
            <option value="ENTREGUE">ENTREGUE</option>
            <option value="CANCELADA">CANCELADA</option>
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl border bg-white p-3">
          <div className="text-sm text-gray-600">
            {loading ? "Carregando..." : `${resumo.qtd} comanda(s)`}
          </div>
          <div className="text-sm font-bold text-gray-900">Total: {brl(resumo.total)}</div>
        </div>

        {msg ? <div className="mt-3 p-3 rounded-xl border bg-green-50 text-sm text-green-700">{msg}</div> : null}
        {err ? <div className="mt-3 p-3 rounded-xl border bg-red-50 text-sm text-red-700">{err}</div> : null}

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          {/* LISTA */}
          <div className="rounded-2xl border bg-white overflow-hidden">
            <div className="p-3 border-b text-sm text-gray-600">Comandas</div>

            <div className="divide-y">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => open(c.id)}
                  className={[
                    "w-full text-left p-3 hover:bg-gray-50",
                    openId === c.id ? "bg-gray-50" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 truncate">{c.id}</div>
                      <div className="text-xs text-gray-600">
                        {fmt(c.created_at)} • {c.forma_pagamento || "-"}
                        {c.cliente_nome ? ` • ${c.cliente_nome}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black">{brl(Number(c.total || 0))}</div>
                      <div className="text-xs font-semibold text-gray-600">{c.status}</div>
                    </div>
                  </div>
                </button>
              ))}

              {!loading && filtered.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">Sem comandas.</div>
              ) : null}
            </div>
          </div>

          {/* DETALHE */}
          <div className="rounded-2xl border bg-white overflow-hidden">
            <div className="p-3 border-b text-sm text-gray-600">Detalhes</div>

            {!openId ? (
              <div className="p-6 text-sm text-gray-500">Selecione uma comanda para ver os itens.</div>
            ) : (
              <div className="p-4">
                <div className="font-black text-gray-900 break-all">{openId}</div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatusComanda(openId, "ABERTA")}
                    className="px-3 py-2 rounded-xl border text-sm font-semibold"
                  >
                    ABERTA
                  </button>
                  <button
                    onClick={() => setStatusComanda(openId, "PAGA")}
                    className="px-3 py-2 rounded-xl border text-sm font-semibold"
                  >
                    PAGA
                  </button>
                  <button
                    onClick={() => setStatusComanda(openId, "ENTREGUE")}
                    className="px-3 py-2 rounded-xl border text-sm font-semibold"
                  >
                    ENTREGUE
                  </button>
                  <button
                    onClick={() => setStatusComanda(openId, "CANCELADA")}
                    className="px-3 py-2 rounded-xl border text-sm font-semibold"
                  >
                    CANCELADA
                  </button>
                </div>

                <div className="mt-4 border rounded-xl overflow-hidden">
                  <div className="p-2 border-b text-xs text-gray-600">Itens</div>

                  {loadingItens ? (
                    <div className="p-4 text-sm text-gray-500">Carregando itens...</div>
                  ) : (
                    <div className="divide-y">
                      {itens.map((it) => (
                        <div key={it.id} className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{it.nome}</div>
                            <div className="text-xs text-gray-600">
                              {it.qtd} × {brl(Number(it.preco))}
                            </div>
                          </div>
                          <div className="text-sm font-black">{brl(Number(it.subtotal))}</div>
                        </div>
                      ))}

                      {itens.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500">Sem itens.</div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
