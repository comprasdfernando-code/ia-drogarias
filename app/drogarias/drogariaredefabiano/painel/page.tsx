"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

/* =========================
   TIPOS
========================= */
type ItemPedido = {
  produto_id?: string;
  ean?: string;
  nome: string;
  qtd: number;
  // compat: pode vir preco ou preco_unit
  preco?: number;
  preco_unit?: number;
  total_item?: number;
};

type Pedido = {
  id: string;
  created_at: string;
  status: "NOVO" | "PREPARO" | "PRONTO" | "ENTREGUE" | string;

  canal?: "PDV" | "FV" | "SITE" | string;
  comanda?: string | null;

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
const STATUS_STYLE: Record<string, { badge: string; card: string; btn: string; label: string }> = {
  NOVO: {
    badge: "bg-yellow-200 text-yellow-950 border border-yellow-300",
    card: "border-l-8 border-yellow-500",
    btn: "bg-yellow-600 hover:bg-yellow-700",
    label: "NOVO",
  },
  PREPARO: {
    badge: "bg-blue-200 text-blue-950 border border-blue-300",
    card: "border-l-8 border-blue-600",
    btn: "bg-blue-700 hover:bg-blue-800",
    label: "PREPARO",
  },
  PRONTO: {
    badge: "bg-purple-200 text-purple-950 border border-purple-300",
    card: "border-l-8 border-purple-600",
    btn: "bg-purple-700 hover:bg-purple-800",
    label: "PRONTO",
  },
  ENTREGUE: {
    badge: "bg-green-200 text-green-950 border border-green-300",
    card: "border-l-8 border-green-600",
    btn: "bg-green-700 hover:bg-green-800",
    label: "ENTREGUE",
  },
};

function proximoStatus(s: string) {
  if (s === "NOVO") return "PREPARO";
  if (s === "PREPARO") return "PRONTO";
  if (s === "PRONTO") return "ENTREGUE";
  return "ENTREGUE";
}

function brl(v: number | null | undefined) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function safeDateBR(d: string) {
  try {
    return new Date(d).toLocaleString("pt-BR");
  } catch {
    return d;
  }
}

function labelStatus(s: string) {
  if (s === "NOVO") return "Novo";
  if (s === "PREPARO") return "Em preparo";
  if (s === "PRONTO") return "Pronto";
  if (s === "ENTREGUE") return "Entregue";
  return s;
}

function buildWhatsAppLink(phone: string, msg: string) {
  const clean = onlyDigits(phone);
  const text = encodeURIComponent(msg);
  // phone aqui vem só com DDD+numero, ex: 11999999999
  return `https://wa.me/55${clean}?text=${text}`;
}

function itemPrecoUnit(i: any) {
  const v = Number(i?.preco_unit ?? i?.preco ?? 0);
  return Number.isFinite(v) ? v : 0;
}

function itemTotal(i: any) {
  const t = Number(i?.total_item ?? 0);
  if (t && Number.isFinite(t)) return t;
  return itemPrecoUnit(i) * Number(i?.qtd || 0);
}

function msgStatusPedido(p: Pedido) {
  const entrega = p.tipo_entrega === "ENTREGA" ? "Entrega" : "Retirada";
  const when = safeDateBR(p.created_at);
  const idCurto = p.id.slice(0, 6).toUpperCase();

  const itens = (p.itens || [])
    .slice(0, 12)
    .map((i) => `• ${i.qtd}x ${i.nome}`)
    .join("\n");

  const end =
    p.tipo_entrega === "ENTREGA"
      ? `\nEndereço: ${p.endereco || "-"}, ${p.numero || "-"} - ${p.bairro || "-"}`
      : "";

  const comanda = p.comanda ? `\nComanda: ${p.comanda}` : "";

  return (
    `Olá, ${p.cliente_nome || "tudo bem"}! 🙂\n` +
    `Seu pedido ${idCurto} está com status: *${labelStatus(p.status)}*.\n` +
    `Tipo: ${entrega} • Pagamento: ${p.pagamento}${comanda}\n` +
    `Total: ${brl(Number(p.total || 0))}\n` +
    `${end}\n\n` +
    `Itens:\n${itens || "• (sem itens)"}\n\n` +
    `Pedido feito em: ${when}\n` +
    `Qualquer dúvida, me chama por aqui. ✅\n` +
    `Entrega em até 24h (normalmente entre 8h e 15h). ✅`
  );
}

/* =========================
   PAGE
========================= */
export default function PainelPedidosDRF() {
  const TABLE = "drf_pedidos";

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idsRef = useRef<Set<string>>(new Set());

  /* =========================
     LOAD PEDIDOS
  ========================= */
  async function carregar() {
    setErroAcao(null);
    setLoading(true);

    const { data, error } = await supabase.from(TABLE).select("*").order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setErroAcao(error.message || "Erro ao carregar pedidos.");
      setLoading(false);
      return;
    }

    setPedidos((data || []) as Pedido[]);
    idsRef.current = new Set((data || []).map((p: any) => p.id));
    setLoading(false);
  }

  /* =========================
     STATUS
  ========================= */
  async function mudarStatus(id: string, status: string) {
    setErroAcao(null);

    const { error } = await supabase.from(TABLE).update({ status }).eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao mudar status (RLS?).");
      return;
    }

    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  /* =========================
     REALTIME
  ========================= */
  useEffect(() => {
    carregar();

    const channel = supabase
      .channel("drf-painel-pedidos")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, async (payload) => {
        await carregar();

        if (payload.eventType === "INSERT") {
          const id = (payload.new as any)?.id;
          if (id && !idsRef.current.has(id)) {
            idsRef.current.add(id);
            try {
              await audioRef.current?.play();
            } catch {
              // navegador pode bloquear até 1 clique
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <h1 className="text-2xl font-extrabold text-gray-950">📥 Painel de Pedidos – DRF</h1>
          <p className="text-sm text-gray-800">Pedidos em tempo real • controle por etapas</p>
        </div>

        <div className="flex gap-2">
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-950 font-semibold shadow-sm"
          >
            <option value="TODOS">Todos</option>
            <option value="NOVO">Novo</option>
            <option value="PREPARO">Preparo</option>
            <option value="PRONTO">Pronto</option>
            <option value="ENTREGUE">Entregue</option>
          </select>

          <button
            onClick={carregar}
            className="border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-950 font-extrabold shadow-sm hover:bg-gray-100"
          >
            Atualizar
          </button>
        </div>
      </div>

      {erroAcao ? (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-2xl p-3 text-red-900 font-semibold">
          {erroAcao}
        </div>
      ) : null}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-gray-900 font-semibold">Carregando...</div>
      ) : null}

      {/* LISTA */}
      <div className="space-y-3">
        {filtrados.map((p) => {
          const st = STATUS_STYLE[p.status] || STATUS_STYLE["NOVO"];
          const itens = (p.itens as any[]) || [];
          const qtdItens = itens.reduce((s, i) => s + Number(i.qtd || 0), 0);

          const entregaLabel = p.tipo_entrega === "ENTREGA" ? "🚚 Entrega" : "🏪 Retirada";
          const canalLabel = p.canal ? `(${p.canal})` : "";

          return (
            <div key={p.id} className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-4 ${st.card}`}>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-gray-950 text-base">
                      Pedido {p.id.slice(0, 6).toUpperCase()}
                      {p.comanda ? <span className="ml-2 text-gray-800 font-extrabold">• Comanda {p.comanda}</span> : null}
                      {canalLabel ? <span className="ml-2 text-xs text-gray-700 font-semibold">{canalLabel}</span> : null}
                    </strong>

                    <span className={`text-xs px-2 py-1 rounded-full font-extrabold ${st.badge}`}>{st.label}</span>
                    <span className="text-xs text-gray-800 font-semibold">{safeDateBR(p.created_at)}</span>
                  </div>

                  <p className="text-sm mt-1 text-gray-950 font-semibold">
                    <span className="font-extrabold">{brl(p.total)}</span>
                    <span className="text-gray-800"> • {entregaLabel} • {p.pagamento}</span>
                    {qtdItens > 0 ? <span className="text-gray-800"> • {qtdItens} itens</span> : null}
                  </p>

                  {/* CLIENTE */}
                  <div className="mt-3 text-sm bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="font-extrabold text-gray-950">{entregaLabel}</div>
                      <div className="text-xs text-gray-800 font-semibold">
                        Subtotal: {brl(p.subtotal)} • Taxa: {brl(p.taxa_entrega)} • Total:{" "}
                        <span className="font-extrabold text-gray-950">{brl(p.total)}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-gray-950 font-semibold">{p.cliente_nome || "-"}</div>
                    <div className="text-gray-900 font-semibold">{p.cliente_whatsapp || "-"}</div>

                    {p.tipo_entrega === "ENTREGA" ? (
                      <div className="mt-1 text-sm text-gray-900 font-semibold">
                        {p.endereco || "-"}, {p.numero || "-"} • {p.bairro || "-"}
                      </div>
                    ) : null}
                  </div>

                  {/* ITENS */}
                  <div className="mt-3">
                    <button
                      onClick={() => setAbertos((x) => ({ ...x, [p.id]: !x[p.id] }))}
                      className="text-sm font-extrabold border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-950 hover:bg-gray-100"
                    >
                      {abertos[p.id] ? "▾ Ocultar itens" : "▸ Ver itens"}
                    </button>

                    {abertos[p.id] ? (
                      <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm space-y-1">
                        {itens.length === 0 ? (
                          <div className="text-gray-900 font-semibold">Sem itens carregados.</div>
                        ) : (
                          itens.map((i: any, idx: number) => (
                            <div key={idx} className="flex justify-between gap-3">
                              <span className="text-gray-950 font-semibold truncate">
                                {Number(i.qtd || 0)}x {i.nome}{" "}
                                {i.ean ? <span className="text-gray-700 font-bold">• EAN {i.ean}</span> : null}
                              </span>

                              <span className="text-gray-950 font-extrabold whitespace-nowrap">
                                {brl(itemTotal(i))}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* AÇÕES */}
                <div className="flex flex-row lg:flex-col items-stretch lg:items-end gap-2">
                  <Link
                    href={`/drogarias/drogariaredefabiano/cupom/${p.id}`}
                    target="_blank"
                    className="px-3 py-2 rounded-xl bg-gray-950 text-white font-extrabold hover:bg-black text-center"
                  >
                    🖨️ Imprimir
                  </Link>

                  <a
                    href={p.cliente_whatsapp ? buildWhatsAppLink(p.cliente_whatsapp, msgStatusPedido(p)) : undefined}
                    target="_blank"
                    rel="noreferrer"
                    className={`px-3 py-2 rounded-xl text-center font-extrabold border ${
                      p.cliente_whatsapp
                        ? "bg-green-700 hover:bg-green-800 text-white border-green-800"
                        : "bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed"
                    }`}
                    title={p.cliente_whatsapp ? "Enviar status no WhatsApp" : "Cliente sem WhatsApp"}
                    onClick={(e) => {
                      if (!p.cliente_whatsapp) e.preventDefault();
                    }}
                  >
                    💬 WhatsApp
                  </a>

                  <button
                    onClick={() => mudarStatus(p.id, proximoStatus(p.status))}
                    className={`px-3 py-2 rounded-xl text-white font-extrabold ${st.btn}`}
                    title="Avançar para a próxima etapa"
                  >
                    Avançar ▶
                  </button>
                </div>
              </div>

              {/* STATUS MANUAL */}
              <div className="flex gap-2 mt-4 flex-wrap">
                {(["NOVO", "PREPARO", "PRONTO", "ENTREGUE"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => mudarStatus(p.id, s)}
                    className="px-3 py-2 border border-gray-300 rounded-xl bg-white text-gray-950 font-extrabold hover:bg-gray-100"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-800 font-semibold mt-3">
                Dica: se o som não tocar, clique 1 vez na tela (o navegador libera áudio).
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
