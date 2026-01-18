"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ItemPedido = {
  produto_id?: string;
  ean?: string;
  nome: string;
  qtd: number;
  preco: number;
};

type Pedido = {
  id: string;
  created_at: string;
  status: "NOVO" | "PREPARO" | "PRONTO" | "ENTREGUE" | string;

  canal?: "PDV" | "SITE" | string;
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

const STATUS_STYLE: Record<string, { badge: string; card: string; btn: string; label: string }> = {
  NOVO: { badge: "bg-yellow-200 text-yellow-950 border border-yellow-300", card: "border-l-8 border-yellow-500", btn: "bg-yellow-600 hover:bg-yellow-700", label: "NOVO" },
  PREPARO:{ badge: "bg-blue-200 text-blue-950 border border-blue-300", card: "border-l-8 border-blue-600", btn: "bg-blue-700 hover:bg-blue-800", label: "PREPARO" },
  PRONTO:{ badge: "bg-purple-200 text-purple-950 border border-purple-300", card: "border-l-8 border-purple-600", btn: "bg-purple-700 hover:bg-purple-800", label: "PRONTO" },
  ENTREGUE:{ badge: "bg-green-200 text-green-950 border border-green-300", card: "border-l-8 border-green-600", btn: "bg-green-700 hover:bg-green-800", label: "ENTREGUE" },
};

function proximoStatus(s: string) {
  if (s === "NOVO") return "PREPARO";
  if (s === "PREPARO") return "PRONTO";
  if (s === "PRONTO") return "ENTREGUE";
  return "ENTREGUE";
}
function brl(n: number) {
  return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}
function buildWhatsappStatusMsg(p: Pedido) {
  const idCurto = p.id.slice(0, 6).toUpperCase();
  const st = (STATUS_STYLE[p.status]?.label || p.status || "NOVO").toUpperCase();
  const total = brl(p.total);
  const comanda = p.comanda ? `\nComanda: ${p.comanda}` : "";
  return `Olá, ${p.cliente_nome || "cliente"}! 😊\nSeu pedido ${idCurto} está em: *${st}*.\nTotal: ${total}${comanda}\n\nDrogaria Rede Fabiano`;
}

export default function PainelPedidosDRF() {
  const TABLE = "drf_pedidos";

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idsRef = useRef<Set<string>>(new Set());

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase.from(TABLE).select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    setPedidos((data || []) as Pedido[]);
    idsRef.current = new Set((data || []).map((p: any) => p.id));
    setLoading(false);
  }

  async function mudarStatus(id: string, status: string) {
    const { error } = await supabase.from(TABLE).update({ status }).eq("id", id);
    if (error) {
      console.error(error);
      alert("Erro ao mudar status (RLS?).");
      return;
    }
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  function enviarWhatsStatus(p: Pedido) {
    const tel = onlyDigits(p.cliente_whatsapp || "");
    if (tel.length < 10) return alert("Cliente sem WhatsApp válido.");
    const msg = buildWhatsappStatusMsg(p);
    const url = `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

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
            try { await audioRef.current?.play(); } catch {}
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(() => {
    if (filtro === "TODOS") return pedidos;
    return pedidos.filter((p) => p.status === filtro);
  }, [pedidos, filtro]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />

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

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-gray-900 font-semibold">Carregando...</div>
      ) : null}

      <div className="space-y-3">
        {filtrados.map((p) => {
          const st = STATUS_STYLE[p.status] || STATUS_STYLE["NOVO"];
          const itens = (p.itens as any[]) || [];
          const qtdItens = itens.reduce((s, i) => s + Number(i.qtd || 0), 0);
          const entregaLabel = p.tipo_entrega === "ENTREGA" ? "🚚 Entrega" : "🏪 Retirada";

          return (
            <div key={p.id} className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-4 ${st.card}`}>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-gray-950 text-base">
                      Pedido {p.id.slice(0, 6).toUpperCase()}
                      {p.comanda ? <span className="ml-2 text-gray-800 font-extrabold">• Comanda {p.comanda}</span> : null}
                      {p.canal ? <span className="ml-2 text-xs text-gray-700 font-semibold">({p.canal})</span> : null}
                    </strong>

                    <span className={`text-xs px-2 py-1 rounded-full font-extrabold ${st.badge}`}>{st.label}</span>
                    <span className="text-xs text-gray-800 font-semibold">{new Date(p.created_at).toLocaleString("pt-BR")}</span>
                  </div>

                  <p className="text-sm mt-1 text-gray-950 font-semibold">
                    <span className="font-extrabold">{brl(p.total)}</span>
                    <span className="text-gray-800"> • {entregaLabel} • {p.pagamento}</span>
                    {qtdItens > 0 ? <span className="text-gray-800"> • {qtdItens} itens</span> : null}
                  </p>

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
                              <span className="text-gray-950 font-semibold truncate">{i.qtd}x {i.nome}</span>
                              <span className="text-gray-950 font-extrabold whitespace-nowrap">
                                {brl((Number(i.preco) || 0) * (Number(i.qtd) || 0))}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col items-stretch lg:items-end gap-2">
                  <Link
                    href={`/drogarias/drogariaredefabiano/cupom/${p.id}`}
                    target="_blank"
                    className="px-3 py-2 rounded-xl bg-gray-950 text-white font-extrabold hover:bg-black text-center"
                  >
                    🖨️ Imprimir
                  </Link>

                  <button
                    onClick={() => enviarWhatsStatus(p)}
                    className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold"
                    title="Enviar status no WhatsApp"
                  >
                    💬 Whats
                  </button>

                  <button
                    onClick={() => mudarStatus(p.id, proximoStatus(p.status))}
                    className={`px-3 py-2 rounded-xl text-white font-extrabold ${st.btn}`}
                    title="Avançar para a próxima etapa"
                  >
                    Avançar ▶
                  </button>
                </div>
              </div>

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
