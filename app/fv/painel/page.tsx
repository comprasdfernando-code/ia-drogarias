"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

/* =========================
   TIPOS
========================= */
type ItemPedido = {
  id?: string;
  ean?: string; // 👈 importante pro estoque
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

  // 👇 novos campos (opcionais no TS; no banco a gente cria)
  estoque_df_baixado_at?: string | null;
  estoque_df_ok?: boolean | null;
  estoque_df_msg?: string | null;
};

/* =========================
   STATUS UI (mais contraste)
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

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
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
  return `https://wa.me/55${clean}?text=${text}`;
}

function msgStatusPedido(p: Pedido) {
  const entrega = p.tipo_entrega === "ENTREGA" ? "Entrega" : "Retirada";
  const when = safeDateBR(p.created_at);

  const itens = (p.itens || [])
    .slice(0, 12)
    .map((i) => `• ${i.qtd}x ${i.nome}`)
    .join("\n");

  const end =
    p.tipo_entrega === "ENTREGA"
      ? `\nEndereço: ${p.endereco || "-"}, ${p.numero || "-"} - ${p.bairro || "-"}`
      : "";

  return (
    `Olá, ${p.cliente_nome || "tudo bem"}! 🙂\n` +
    `Seu pedido ${p.id.slice(0, 6).toUpperCase()} está com status: *${labelStatus(p.status)}*.\n` +
    `Tipo: ${entrega} • Pagamento: ${p.pagamento}\n` +
    `Total: ${brl(Number(p.total || 0))}\n` +
    `${end}\n\n` +
    `Itens:\n${itens || "• (sem itens)"}\n\n` +
    `Pedido feito em: ${when}\n` +
    `Qualquer dúvida, me chama por aqui. ✅`
  );
}


function safeDateBR(d: string) {
  try {
    return new Date(d).toLocaleString("pt-BR");
  } catch {
    return d;
  }
}

/* =========================
   PAGE
========================= */
export default function PainelPedidosFV() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  // estoque DF
  const [baixandoId, setBaixandoId] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idsRef = useRef<Set<string>>(new Set());

  /* =========================
     LOAD PEDIDOS
  ========================= */
  async function carregar() {
    setLoading(true);

    const { data, error } = await supabase.from("fv_pedidos").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error(error);
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

    const { error } = await supabase.from("fv_pedidos").update({ status }).eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao mudar status (RLS?).");
      return;
    }

    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  /* =========================
     BAIXAR ESTOQUE DF (Modo A / Opção 2)
     RPC: fv_baixar_estoque_df(p_pedido_id uuid)
  ========================= */
  async function baixarEstoqueDF(pedidoId: string) {
    setErroAcao(null);
    setBaixandoId(pedidoId);

    try {
      const { data, error } = await supabase.rpc("fv_baixar_estoque_df", {
        p_pedido_id: pedidoId,
      });

      if (error) throw error;

      // RPC pode retornar texto/obj; a gente só recarrega
      await carregar();
      return data;
    } catch (e: any) {
      console.error("Erro baixarEstoqueDF:", e);
      setErroAcao(e?.message || "Não consegui baixar o estoque da DF.");
      alert(e?.message || "Não consegui baixar o estoque da DF.");
    } finally {
      setBaixandoId(null);
    }
  }

  /* =========================
     REALTIME
  ========================= */
  useEffect(() => {
    carregar();

    const channel = supabase
      .channel("fv-painel-pedidos")
      .on("postgres_changes", { event: "*", schema: "public", table: "fv_pedidos" }, async (payload) => {
        await carregar();

        if (payload.eventType === "INSERT") {
          const id = (payload.new as any)?.id;
          if (id && !idsRef.current.has(id)) {
            idsRef.current.add(id);
            try {
              await audioRef.current?.play();
            } catch {
              // navegador pode bloquear até 1 clique na tela
            }
          }
        }
      })
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
          <h1 className="text-2xl font-extrabold text-gray-950">📥 Painel de Pedidos – FV</h1>
          <p className="text-sm text-gray-800">Pedidos em tempo real • controle por etapas • baixa de estoque DF</p>
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

          const jaBaixou = !!p.estoque_df_baixado_at;
          const podeBaixarAgora = !jaBaixou && (p.status === "NOVO" || p.status === "PREPARO");

          const temEanFaltando = itens.some((i) => !String(i?.ean || "").trim());
          const btnDisabled = !!baixandoId || !podeBaixarAgora || itens.length === 0 || temEanFaltando;

          return (
            <div key={p.id} className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-4 ${st.card}`}>
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-gray-950 text-base">Pedido {p.id.slice(0, 6).toUpperCase()}</strong>

                    <span className={`text-xs px-2 py-1 rounded-full font-extrabold ${st.badge}`}>{st.label}</span>

                    <span className="text-xs text-gray-800 font-semibold">{safeDateBR(p.created_at)}</span>

                    {/* Badge estoque DF */}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-extrabold border ${
                        jaBaixou
                          ? "bg-green-100 text-green-950 border-green-200"
                          : "bg-gray-100 text-gray-900 border-gray-200"
                      }`}
                      title={jaBaixou ? `Baixado em: ${safeDateBR(p.estoque_df_baixado_at as string)}` : "Ainda não baixado"}
                    >
                      DF: {jaBaixou ? "BAIXADO" : "PENDENTE"}
                    </span>
                  </div>

                  <p className="text-sm mt-1 text-gray-950 font-semibold">
                    <span className="font-extrabold">{brl(p.total)}</span>
                    <span className="text-gray-800"> • {entregaLabel} • {p.pagamento}</span>
                    {qtdItens > 0 && <span className="text-gray-800"> • {qtdItens} itens</span>}
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

                    {p.tipo_entrega === "ENTREGA" && (
                      <div className="mt-1 text-sm text-gray-900 font-semibold">
                        {p.endereco || "-"}, {p.numero || "-"} • {p.bairro || "-"}
                      </div>
                    )}
                  </div>

                  {/* ITENS */}
                  <div className="mt-3">
                    <button
                      onClick={() => setAbertos((x) => ({ ...x, [p.id]: !x[p.id] }))}
                      className="text-sm font-extrabold border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-950 hover:bg-gray-100"
                    >
                      {abertos[p.id] ? "▾ Ocultar itens" : "▸ Ver itens"}
                    </button>

                    {abertos[p.id] && (
                      <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm space-y-1">
                        {itens.length === 0 ? (
                          <div className="text-gray-900 font-semibold">Sem itens carregados (campo itens vazio).</div>
                        ) : (
                          <>
                            {temEanFaltando ? (
                              <div className="mb-2 bg-yellow-50 border border-yellow-200 rounded-xl p-2 text-yellow-900 font-semibold">
                                Atenção: tem item sem EAN. Para baixar estoque DF, cada item precisa ter <b>ean</b>.
                              </div>
                            ) : null}

                            {itens.map((i, idx) => (
                              <div key={idx} className="flex justify-between gap-3">
                                <span className="text-gray-950 font-semibold truncate">
                                  {i.qtd}x {i.nome}{" "}
                                  <span className="text-gray-700 font-bold">
                                    {i.ean ? `• EAN ${i.ean}` : ""}
                                  </span>
                                </span>
                                <span className="text-gray-950 font-extrabold whitespace-nowrap">
                                  {brl((Number(i.preco) || 0) * (Number(i.qtd) || 0))}
                                </span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* AÇÕES */}
                <div className="flex flex-row lg:flex-col items-stretch lg:items-end gap-2">
  <Link
    href={`/fv/cupom/${p.id}`}
    target="_blank"
    className="px-3 py-2 rounded-xl bg-gray-950 text-white font-extrabold hover:bg-black text-center"
  >
    🖨️ Imprimir
  </Link>

  <a
    href={
      p.cliente_whatsapp
        ? buildWhatsAppLink(p.cliente_whatsapp, msgStatusPedido(p))
        : undefined
    }
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
