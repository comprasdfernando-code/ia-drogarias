"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Venda = {
  id: string;
  data: string;
  total: number;
  status: "novo" | "preparo" | "pronto" | "entregue" | string;
  tipo_entrega: "retirada" | "entrega" | string;
  metodo_pagamento: string;
  cliente_nome?: string | null;
  cliente_telefone?: string | null;
  cliente_endereco?: string | null;
};

const STATUS_STYLE: Record<
  string,
  { badge: string; card: string; btn: string; label: string }
> = {
  novo: {
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    card: "border-l-8 border-yellow-400",
    btn: "bg-yellow-500 hover:bg-yellow-600",
    label: "NOVO",
  },
  preparo: {
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    card: "border-l-8 border-blue-500",
    btn: "bg-blue-600 hover:bg-blue-700",
    label: "PREPARO",
  },
  pronto: {
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    card: "border-l-8 border-purple-500",
    btn: "bg-purple-600 hover:bg-purple-700",
    label: "PRONTO",
  },
  entregue: {
    badge: "bg-green-100 text-green-800 border-green-200",
    card: "border-l-8 border-green-500",
    btn: "bg-green-600 hover:bg-green-700",
    label: "ENTREGUE",
  },
};

function proximoStatus(status: string) {
  if (status === "novo") return "preparo";
  if (status === "preparo") return "pronto";
  if (status === "pronto") return "entregue";
  return "entregue";
}

export default function PainelPedidos() {
  const [pedidos, setPedidos] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>("todos");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ultimosIdsRef = useRef<Set<string>>(new Set());

  const filtrados = useMemo(() => {
    if (filtro === "todos") return pedidos;
    return pedidos.filter((p) => p.status === filtro);
  }, [pedidos, filtro]);

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("gigante_vendas")
      .select(
        "id,data,total,status,tipo_entrega,metodo_pagamento,cliente_nome,cliente_telefone,cliente_endereco"
      )
      .order("data", { ascending: false });

    if (!error && data) {
      setPedidos(data as any);
      ultimosIdsRef.current = new Set((data as any).map((p: any) => p.id));
    } else {
      console.error(error);
    }
    setLoading(false);
  }

  async function mudarStatus(id: string, status: string) {
    const { error } = await supabase
      .from("gigante_vendas")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao mudar status (RLS?).");
      return;
    }

    // atualiza rápido sem esperar realtime
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  }

  useEffect(() => {
    carregar();

    const channel = supabase
      .channel("gigante-painel-pedidos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gigante_vendas" },
        async (payload) => {
          // Recarrega lista
          const { data } = await supabase
            .from("gigante_vendas")
            .select(
              "id,data,total,status,tipo_entrega,metodo_pagamento,cliente_nome,cliente_telefone,cliente_endereco"
            )
            .order("data", { ascending: false });

          if (data) setPedidos(data as any);

          // 🔔 Som somente quando chegar INSERT novo
          if (payload.eventType === "INSERT") {
            const novoId = (payload.new as any)?.id;
            if (novoId && !ultimosIdsRef.current.has(novoId)) {
              ultimosIdsRef.current.add(novoId);
              try {
                await audioRef.current?.play();
              } catch {
                // navegador pode bloquear até 1 clique
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* áudio do “bip” */}
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">📥 Painel de Pedidos</h1>
          <p className="text-sm text-gray-600">
            Realtime + etapas por cor (igual KDS).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="px-3 py-2 rounded border bg-white"
          >
            <option value="todos">Todos</option>
            <option value="novo">Novo</option>
            <option value="preparo">Preparo</option>
            <option value="pronto">Pronto</option>
            <option value="entregue">Entregue</option>
          </select>

          <button onClick={carregar} className="px-3 py-2 rounded border bg-white">
            Atualizar
          </button>
        </div>
      </div>

      {loading && <p>Carregando...</p>}

      <div className="space-y-3">
        {filtrados.map((p) => {
          const st = STATUS_STYLE[p.status] || STATUS_STYLE["novo"];

          return (
            <div
              key={p.id}
              className={`bg-white rounded-xl shadow p-3 ${st.card}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">
                      Pedido {p.id.slice(0, 6).toUpperCase()}
                    </p>

                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${st.badge}`}
                    >
                      {st.label}
                    </span>

                    <span className="text-xs text-gray-500">
                      {new Date(p.data).toLocaleString("pt-BR")}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-semibold">R$ {Number(p.total).toFixed(2)}</span>{" "}
                    • {p.tipo_entrega} • {p.metodo_pagamento}
                  </p>

                  {p.tipo_entrega === "entrega" && (
                    <div className="text-sm text-gray-700 mt-2 bg-gray-50 border rounded-lg p-2">
                      <div className="font-semibold">📍 Entrega</div>
                      <div className="truncate">{p.cliente_nome}</div>
                      <div className="truncate">{p.cliente_telefone}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {p.cliente_endereco}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Link
                    className="px-3 py-2 rounded bg-gray-900 text-white"
                    href={`/gigante/cupom/${p.id}`}
                    target="_blank"
                  >
                    🖨️ Imprimir
                  </Link>

                  <button
                    onClick={() => mudarStatus(p.id, proximoStatus(p.status))}
                    className={`px-3 py-2 rounded text-white ${st.btn}`}
                    title="Avançar para a próxima etapa"
                  >
                    Avançar ▶
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => mudarStatus(p.id, "novo")}
                  className="px-3 py-2 rounded border bg-white hover:bg-gray-50"
                >
                  Novo
                </button>
                <button
                  onClick={() => mudarStatus(p.id, "preparo")}
                  className="px-3 py-2 rounded border bg-white hover:bg-gray-50"
                >
                  Preparo
                </button>
                <button
                  onClick={() => mudarStatus(p.id, "pronto")}
                  className="px-3 py-2 rounded border bg-white hover:bg-gray-50"
                >
                  Pronto
                </button>
                <button
                  onClick={() => mudarStatus(p.id, "entregue")}
                  className="px-3 py-2 rounded border bg-white hover:bg-gray-50"
                >
                  Entregue
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Dica: se o som não tocar, clique 1 vez no painel (o navegador libera áudio).
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
