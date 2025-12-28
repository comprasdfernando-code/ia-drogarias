"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

// ✅ WhatsApp OFICIAL do Gigante (com DDI Brasil)
const WHATSAPP_GIGANTE = "5511948163211"; // 11 94816-3211

type ItemVenda = {
  id?: string;
  nome: string;
  quantidade: number;
  preco: number;
  subtotal?: number | null;
};

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

  // ✅ Itens do pedido (relacionamento com gigante_venda_itens)
  itens?: ItemVenda[];
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

function onlyDigits(v?: string | null) {
  return (v || "").replace(/\D/g, "");
}

function formatMoney(n: number) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PainelPedidos() {
  const [pedidos, setPedidos] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>("todos");
  const [abertoItens, setAbertoItens] = useState<Record<string, boolean>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ultimosIdsRef = useRef<Set<string>>(new Set());

  const filtrados = useMemo(() => {
    if (filtro === "todos") return pedidos;
    return pedidos.filter((p) => p.status === filtro);
  }, [pedidos, filtro]);

  function toggleItens(id: string) {
    setAbertoItens((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function carregar() {
    setLoading(true);

    // ✅ Puxa venda + itens (relacionamento via venda_id)
    // Se o relacionamento não estiver reconhecido pelo Supabase, veja OBS abaixo.
    const { data, error } = await supabase
      .from("gigante_vendas")
      .select(
        `
        id,
        data,
        total,
        status,
        tipo_entrega,
        metodo_pagamento,
        cliente_nome,
        cliente_telefone,
        cliente_endereco,
        itens:gigante_venda_itens (
          id,
          nome,
          quantidade,
          preco,
          subtotal
        )
      `
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
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  // ✅ Envia para o WhatsApp DO GIGANTE
  function enviarTotalWhatsApp(p: Venda) {
    if (p.tipo_entrega !== "entrega") {
      alert("Esse botão é só para pedidos de entrega.");
      return;
    }

    const telCliente = onlyDigits(p.cliente_telefone);
    if (!telCliente) {
      alert("Pedido sem WhatsApp do cliente (campo vazio).");
      return;
    }

    const freteStr = prompt("Valor do frete (ex: 8,50):");
    if (!freteStr) return;

    const frete = Number(freteStr.replace(",", "."));
    if (isNaN(frete) || frete < 0) {
      alert("Valor de frete inválido.");
      return;
    }

    const subtotal = Number(p.total) || 0;
    const totalFinal = subtotal + frete;

    const itensTexto =
      p.itens && p.itens.length
        ? p.itens
            .map((i) => {
              const sub = (Number(i.preco) || 0) * (Number(i.quantidade) || 0);
              return `• ${i.quantidade}x ${i.nome} - R$ ${formatMoney(sub)}`;
            })
            .join("\n")
        : "(Itens não carregados)";

    const mensagem = encodeURIComponent(
      `🛵 *Gigante dos Assados*\n\n` +
        `🧾 Pedido *${p.id.slice(0, 6).toUpperCase()}*\n\n` +
        `🍖 Itens:\n${itensTexto}\n\n` +
        `Subtotal: R$ ${formatMoney(subtotal)}\n` +
        `Frete: R$ ${formatMoney(frete)}\n` +
        `*Total: R$ ${formatMoney(totalFinal)}*\n\n` +
        `📍 *Cliente*\n` +
        `Nome: ${p.cliente_nome || "-"}\n` +
        `WhatsApp: ${p.cliente_telefone || "-"}\n` +
        `Endereço: ${p.cliente_endereco || "-"}\n\n` +
        `💳 Pagamento: ${p.metodo_pagamento}\n\n` +
        `➡️ *Responder o cliente e confirmar o pedido*`
    );

    window.open(
      `https://wa.me/${WHATSAPP_GIGANTE}?text=${mensagem}`,
      "_blank"
    );
  }

  useEffect(() => {
    carregar();

    // 🔔 realtime
    const channel = supabase
      .channel("gigante-painel-pedidos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gigante_vendas" },
        async (payload) => {
          // Recarrega lista (inclui itens)
          await carregar();

          // bip só no INSERT novo
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">📥 Painel de Pedidos</h1>
          <p className="text-sm text-gray-600">
            Realtime + etapas por cor + itens do pedido.
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

          <button
            onClick={carregar}
            className="px-3 py-2 rounded border bg-white"
          >
            Atualizar
          </button>
        </div>
      </div>

      {loading && <p>Carregando...</p>}

      <div className="space-y-3">
        {filtrados.map((p) => {
          const st = STATUS_STYLE[p.status] || STATUS_STYLE["novo"];
          const itens = p.itens || [];
          const qtdItens = itens.reduce(
            (s, i) => s + Number(i.quantidade || 0),
            0
          );

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
                    <span className="font-semibold">
                      R$ {Number(p.total).toFixed(2)}
                    </span>{" "}
                    • {p.tipo_entrega} • {p.metodo_pagamento}
                    {itens.length > 0 && (
                      <>
                        {" "}
                        • <span className="font-semibold">{qtdItens}</span>{" "}
                        itens
                      </>
                    )}
                  </p>

                  {/* ✅ ITENS DO PEDIDO */}
                  <div className="mt-2">
                    <button
                      onClick={() => toggleItens(p.id)}
                      className="text-sm px-3 py-2 rounded border bg-white hover:bg-gray-50"
                    >
                      {abertoItens[p.id] ? "▾ Ocultar itens" : "▸ Ver itens"}
                    </button>

                    {abertoItens[p.id] && (
                      <div className="mt-2 bg-gray-50 border rounded-lg p-2">
                        {itens.length === 0 ? (
                          <p className="text-sm text-gray-600">
                            Itens não carregados (verifique relacionamento /
                            select).
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {itens.map((i, idx) => {
                              const sub =
                                (Number(i.preco) || 0) *
                                (Number(i.quantidade) || 0);
                              return (
                                <div
                                  key={i.id || `${p.id}-${idx}`}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="truncate">
                                    {i.quantidade}x {i.nome}
                                  </span>
                                  <span className="font-semibold">
                                    R$ {formatMoney(sub)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ✅ Dados de entrega (quando entrega) */}
                  {p.tipo_entrega === "entrega" && (
                    <div className="text-sm text-gray-700 mt-3 bg-gray-50 border rounded-lg p-2">
                      <div className="font-semibold">📍 Entrega</div>
                      <div className="truncate">{p.cliente_nome}</div>
                      <div className="truncate">{p.cliente_telefone}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {p.cliente_endereco}
                      </div>
                    </div>
                  )}

                  {/* ✅ Dados do cliente (retirada também) */}
                  {p.tipo_entrega === "retirada" && (
                    <div className="text-sm text-gray-700 mt-3 bg-gray-50 border rounded-lg p-2">
                      <div className="font-semibold">🏠 Retirada</div>
                      <div className="truncate">{p.cliente_nome || "-"}</div>
                      <div className="truncate">{p.cliente_telefone || "-"}</div>
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

                  {/* ✅ Enviar total (somente entrega e não entregue) */}
                  {p.tipo_entrega === "entrega" && p.status !== "entregue" && (
                    <button
                      onClick={() => enviarTotalWhatsApp(p)}
                      className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                      title="Abrir WhatsApp do Gigante com o total + dados do cliente"
                    >
                      📲 Enviar total
                    </button>
                  )}

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
                Dica: se o som não tocar, clique 1 vez no painel (o navegador
                libera áudio).
              </p>
            </div>
          );
        })}
      </div>

      {/* ✅ OBS IMPORTANTE:
          Se os itens NÃO aparecerem, geralmente é porque o Supabase não reconheceu o relacionamento.
          Garanta que existe FK:
            gigante_venda_itens.venda_id -> gigante_vendas.id
          (você já tem), e no Supabase: Database > Table Editor > Relationships (ver se aparece).
      */}
    </div>
  );
}
