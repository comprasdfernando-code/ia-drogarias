"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

/* =========================
   TIPOS
========================= */
type ItemPedido = {
  id?: string;
  nome: string;
  qtd: number;
  preco: number;
  subtotal?: number | null;
};

type Pedido = {
  id: string;
  created_at: string;
  status: "NOVO" | "PREPARO" | "PRONTO" | "ENTREGUE" | string;

  cliente_nome?: string | null;
  cliente_whatsapp?: string | null;

  tipo_entrega: "ENTREGA" | "RETIRADA";
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;

  pagamento: string;
  subtotal: number;
  taxa_entrega: number;
  total: number;

  itens?: ItemPedido[];
};

/* =========================
   STATUS UI
========================= */
const STATUS_STYLE: Record<
  string,
  { badge: string; card: string; btn: string }
> = {
  NOVO: {
    badge: "bg-yellow-100 text-yellow-800",
    card: "border-l-8 border-yellow-400",
    btn: "bg-yellow-500 hover:bg-yellow-600",
  },
  PREPARO: {
    badge: "bg-blue-100 text-blue-800",
    card: "border-l-8 border-blue-500",
    btn: "bg-blue-600 hover:bg-blue-700",
  },
  PRONTO: {
    badge: "bg-purple-100 text-purple-800",
    card: "border-l-8 border-purple-500",
    btn: "bg-purple-600 hover:bg-purple-700",
  },
  ENTREGUE: {
    badge: "bg-green-100 text-green-800",
    card: "border-l-8 border-green-500",
    btn: "bg-green-600 hover:bg-green-700",
  },
};

function proximoStatus(s: string) {
  if (s === "NOVO") return "PREPARO";
  if (s === "PREPARO") return "PRONTO";
  if (s === "PRONTO") return "ENTREGUE";
  return "ENTREGUE";
}

function brl(n: number) {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/* =========================
   PAGE
========================= */
export default function PainelPedidosFV() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idsRef = useRef<Set<string>>(new Set());

  /* =========================
     LOAD PEDIDOS
  ========================= */
  async function carregar() {
    setLoading(true);

    const { data, error } = await supabase
      .from("fv_pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setPedidos(data as Pedido[]);
    idsRef.current = new Set(data?.map((p: any) => p.id));
    setLoading(false);
  }

  /* =========================
     STATUS
  ========================= */
  async function mudarStatus(id: string, status: string) {
    const { error } = await supabase
      .from("fv_pedidos")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("Erro ao mudar status");
      return;
    }

    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  }

  /* =========================
     REALTIME
  ========================= */
  useEffect(() => {
    carregar();

    const channel = supabase
      .channel("fv-painel-pedidos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fv_pedidos" },
        async (payload) => {
          await carregar();

          if (payload.eventType === "INSERT") {
            const id = (payload.new as any)?.id;
            if (id && !idsRef.current.has(id)) {
              idsRef.current.add(id);
              try {
                await audioRef.current?.play();
              } catch {}
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtrados = useMemo(() => {
    if (filtro === "TODOS") return pedidos;
    return pedidos.filter((p) => p.status === filtro);
  }, [pedidos, filtro]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold">📥 Painel de Pedidos – FV</h1>
          <p className="text-sm text-gray-600">
            Pedidos em tempo real • controle por etapas
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="TODOS">Todos</option>
            <option value="NOVO">Novo</option>
            <option value="PREPARO">Preparo</option>
            <option value="PRONTO">Pronto</option>
            <option value="ENTREGUE">Entregue</option>
          </select>

          <button
            onClick={carregar}
            className="border rounded px-3 py-2 bg-white"
          >
            Atualizar
          </button>
        </div>
      </div>

      {loading && <p>Carregando...</p>}

      {/* LISTA */}
      <div className="space-y-3">
        {filtrados.map((p) => {
          const st = STATUS_STYLE[p.status] || STATUS_STYLE["NOVO"];
          const itens = (p.itens as any[]) || [];
          const qtdItens = itens.reduce(
            (s, i) => s + Number(i.qtd || 0),
            0
          );

          return (
            <div
              key={p.id}
              className={`bg-white rounded-xl shadow p-3 ${st.card}`}
            >
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong>
                      Pedido {p.id.slice(0, 6).toUpperCase()}
                    </strong>

                    <span
                      className={`text-xs px-2 py-1 rounded-full ${st.badge}`}
                    >
                      {p.status}
                    </span>

                    <span className="text-xs text-gray-500">
                      {new Date(p.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>

                  <p className="text-sm mt-1 text-gray-700">
                    {brl(p.total)} • {p.tipo_entrega} • {p.pagamento}
                    {qtdItens > 0 && ` • ${qtdItens} itens`}
                  </p>

                  {/* CLIENTE */}
                  <div className="mt-2 text-sm bg-gray-50 border rounded p-2">
                    <strong>{p.tipo_entrega}</strong>
                    <div>{p.cliente_nome || "-"}</div>
                    <div>{p.cliente_whatsapp || "-"}</div>
                    {p.tipo_entrega === "ENTREGA" && (
                      <div className="text-xs text-gray-600">
                        {p.endereco}, {p.numero} – {p.bairro}
                      </div>
                    )}
                  </div>

                  {/* ITENS */}
                  <div className="mt-2">
                    <button
                      onClick={() =>
                        setAbertos((x) => ({
                          ...x,
                          [p.id]: !x[p.id],
                        }))
                      }
                      className="text-sm border rounded px-3 py-1 bg-white"
                    >
                      {abertos[p.id] ? "Ocultar itens" : "Ver itens"}
                    </button>

                    {abertos[p.id] && (
                      <div className="mt-2 bg-gray-50 border rounded p-2 text-sm space-y-1">
                        {itens.map((i, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between"
                          >
                            <span>
                              {i.qtd}x {i.nome}
                            </span>
                            <span>
                              {brl(
                                (Number(i.preco) || 0) *
                                  (Number(i.qtd) || 0)
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* AÇÕES */}
                <div className="flex flex-col items-end gap-2">
                  <Link
                    href={`/fv/cupom/${p.id}`}
                    target="_blank"
                    className="px-3 py-2 rounded bg-gray-900 text-white"
                  >
                    🖨️ Imprimir
                  </Link>

                  <button
                    onClick={() =>
                      mudarStatus(p.id, proximoStatus(p.status))
                    }
                    className={`px-3 py-2 rounded text-white ${st.btn}`}
                  >
                    Avançar ▶
                  </button>
                </div>
              </div>

              {/* STATUS MANUAL */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {["NOVO", "PREPARO", "PRONTO", "ENTREGUE"].map((s) => (
                  <button
                    key={s}
                    onClick={() => mudarStatus(p.id, s)}
                    className="px-3 py-1 border rounded bg-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
