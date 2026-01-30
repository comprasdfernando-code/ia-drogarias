"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Pedido = {
  id: string;
  created_at: string;

  // pode vir da view ou do fallback
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

function escapeHtml(s: any) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sumItens(itens: Item[]) {
  return (itens || []).reduce((acc, i) => acc + (Number(i.subtotal) || (Number(i.preco) || 0) * (Number(i.qty) || 0)), 0);
}

function buildPedidoTexto(pedido: Pedido, itens: Item[]) {
  const itensTxt = (itens || [])
    .map((i) => {
      const nome = `${i.nome}${i.sabor ? ` (${i.sabor})` : ""}`;
      return `- ${nome} | ${brl(i.preco)} x ${i.qty} = ${brl(i.subtotal)}`;
    })
    .join("\n");

  const totalCalc = pedido.total && Number(pedido.total) > 0 ? Number(pedido.total) : sumItens(itens);

  return `PEDIDO ${pedido.codigo}
Data: ${dtBR(pedido.created_at)}
Status: ${pedido.status}

Cliente: ${pedido.cliente_nome ?? "-"}
Endereço: ${pedido.endereco ?? "-"}
Bairro: ${pedido.bairro ?? "-"}
Pagamento: ${pedido.pagamento ?? "-"}
Obs: ${pedido.obs ?? "-"}

Itens:
${itensTxt || "(sem itens)"}

TOTAL: ${brl(totalCalc)}
`;
}

function printNotinha(pedido: Pedido, itens: Item[]) {
  const totalCalc = pedido.total && Number(pedido.total) > 0 ? Number(pedido.total) : sumItens(itens);

  const itensHtml = (itens || [])
    .map((i) => {
      const nome = `${i.nome}${i.sabor ? ` (${i.sabor})` : ""}`;
      return `
        <tr>
          <td style="padding:6px 0;">
            <div style="font-weight:700;">${escapeHtml(nome)}</div>
            <div style="font-size:12px; color:#555;">
              ${escapeHtml(brl(i.preco))} x ${escapeHtml(i.qty)} = <b>${escapeHtml(brl(i.subtotal))}</b>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Notinha ${escapeHtml(pedido.codigo)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 18px; }
        .top { text-align:center; }
        .small { font-size: 12px; color:#444; }
        .box { border-top:1px dashed #999; border-bottom:1px dashed #999; padding:10px 0; margin:10px 0; }
        table { width:100%; border-collapse: collapse; }
        .total { font-size: 16px; font-weight: 900; display:flex; justify-content:space-between; margin-top:10px; }
        @media print {
          button { display:none; }
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="top">
        <div style="font-size:18px; font-weight:900;">Sorveteria Oggi</div>
        <div class="small">IA Drogarias</div>
        <div class="small">Pedido: <b>${escapeHtml(pedido.codigo)}</b></div>
        <div class="small">${escapeHtml(dtBR(pedido.created_at))}</div>
      </div>

      <div class="box small">
        <div><b>Cliente:</b> ${escapeHtml(pedido.cliente_nome)}</div>
        <div><b>Endereço:</b> ${escapeHtml(pedido.endereco)}</div>
        <div><b>Bairro:</b> ${escapeHtml(pedido.bairro)}</div>
        <div><b>Pagamento:</b> ${escapeHtml(pedido.pagamento)}</div>
        ${pedido.obs ? `<div><b>Obs:</b> ${escapeHtml(pedido.obs)}</div>` : ""}
      </div>

      <table>
        ${itensHtml || `<tr><td class="small">Sem itens</td></tr>`}
      </table>

      <div class="box">
        <div class="total">
          <span>Total</span>
          <span>${escapeHtml(brl(totalCalc))}</span>
        </div>
      </div>

      <div class="small" style="text-align:center; margin-top:10px;">
        Obrigado! 💜
      </div>

      <script>
        window.onload = () => { window.print(); };
      </script>
    </body>
  </html>
  `;

  const w = window.open("", "_blank", "width=420,height=720");
  if (!w) {
    alert("Bloqueador de pop-up ativado. Libere para imprimir.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export default function PainelPedidosSorveteria() {
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selected, setSelected] = useState<Pedido | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [fStatus, setFStatus] = useState<string>("todos");
  const [q, setQ] = useState("");

  // ✅ lê pedidos: tenta VIEW, se falhar usa tabela
  async function loadPedidos() {
    setLoading(true);

    // 1) tenta a view (com codigo pronto)
    const res1 = await supabase
      .from("sorveteria_pedidos_view")
      .select("id,created_at,codigo,status,cliente_nome,bairro,endereco,pagamento,obs,total")
      .order("created_at", { ascending: false })
      .limit(300);

    if (!res1.error) {
      setPedidos(((res1.data ?? []) as any) || []);
      setLoading(false);
      return;
    }

    console.warn("Falha ao ler sorveteria_pedidos_view. Fallback para sorveteria_pedidos:", res1.error);

    // 2) fallback: lê tabela (sem codigo), cria codigo por numero ou por id
    const res2 = await supabase
      .from("sorveteria_pedidos")
      .select("id,created_at,numero,status,cliente_nome,bairro,endereco,pagamento,obs,total")
      .order("created_at", { ascending: false })
      .limit(300);

    if (res2.error) {
      console.error("Falha ao ler sorveteria_pedidos:", res2.error);
      setPedidos([]);
      setLoading(false);
      return;
    }

    const mapped = (res2.data ?? []).map((p: any) => ({
      id: p.id,
      created_at: p.created_at,
      codigo: p.numero ? `OGG-${String(p.numero).padStart(6, "0")}` : `PED-${String(p.id).slice(0, 8)}`,
      status: p.status,
      cliente_nome: p.cliente_nome ?? null,
      bairro: p.bairro ?? null,
      endereco: p.endereco ?? null,
      pagamento: p.pagamento ?? null,
      obs: p.obs ?? null,
      total: Number(p.total) || 0,
    }));

    setPedidos(mapped as any);
    setLoading(false);
  }

  async function loadItens(pedidoId: string) {
    const { data, error } = await supabase
      .from("sorveteria_pedido_itens")
      .select("id,pedido_id,nome,sabor,qty,preco,subtotal")
      .eq("pedido_id", pedidoId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao carregar itens:", error);
      setItens([]);
      return;
    }

    const list = (data ?? []) as any as Item[];
    setItens(list);

    // ✅ se total do selected estiver 0, recalcula pelo itens e atualiza o selected (UI)
    setSelected((prev) => {
      if (!prev || prev.id !== pedidoId) return prev;
      const calc = sumItens(list);
      if ((Number(prev.total) || 0) > 0) return prev;
      return { ...prev, total: calc };
    });
  }

  useEffect(() => {
    loadPedidos();

    // realtime
    const ch = supabase
      .channel("sorveteria_pedidos_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sorveteria_pedidos" }, () => {
        loadPedidos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Não consegui atualizar o status. Verifique permissões/RLS.");
      return;
    }

    setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? { ...p, status } : p)));
    if (selected?.id === pedidoId) setSelected({ ...(selected as any), status } as any);
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copiado ✅");
    } catch {
      alert("Não consegui copiar (permissão do navegador).");
    }
  }

  const totalSelectedCalc = useMemo(() => {
    if (!selected) return 0;
    const t = Number(selected.total) || 0;
    return t > 0 ? t : sumItens(itens);
  }, [selected, itens]);

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

            <button onClick={loadPedidos} className="px-4 py-2 rounded-lg bg-neutral-900 text-white font-semibold">
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
                      setItens([]);
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
                        <div className="text-sm font-semibold">{brl(Number(p.total) || 0)}</div>
                        <div className="text-xs px-2 py-1 inline-block rounded-full border">{p.status}</div>
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
                  <div>
                    <span className="font-semibold">Cliente:</span> {selected.cliente_nome ?? "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Endereço:</span> {selected.endereco ?? "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Bairro:</span> {selected.bairro ?? "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Pagamento:</span> {selected.pagamento ?? "—"}
                  </div>
                  {selected.obs ? (
                    <div>
                      <span className="font-semibold">Obs:</span> {selected.obs}
                    </div>
                  ) : null}
                </div>

                {/* AÇÕES */}
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => printNotinha({ ...selected, total: totalSelectedCalc }, itens)}
                    className="w-full px-4 py-2 rounded-lg bg-neutral-900 text-white font-semibold"
                  >
                    Imprimir notinha
                  </button>

                  <button
                    onClick={() => copyText(selected.endereco ? `${selected.endereco} - ${selected.bairro ?? ""}` : "")}
                    className="w-full px-4 py-2 rounded-lg border font-semibold"
                  >
                    Copiar endereço
                  </button>

                  <button
                    onClick={() => copyText(buildPedidoTexto({ ...selected, total: totalSelectedCalc }, itens))}
                    className="w-full px-4 py-2 rounded-lg border font-semibold"
                  >
                    Copiar pedido (texto)
                  </button>
                </div>

                {/* ITENS */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-neutral-50 text-sm font-semibold">Itens</div>
                  <div className="divide-y">
                    {itens.map((i) => (
                      <div key={i.id} className="px-3 py-2 text-sm">
                        <div className="font-semibold text-neutral-900">
                          {i.nome}
                          {i.sabor ? ` (${i.sabor})` : ""}
                        </div>
                        <div className="text-neutral-600">
                          {brl(i.preco)} x {i.qty} = <span className="font-semibold">{brl(i.subtotal)}</span>
                        </div>
                      </div>
                    ))}
                    {itens.length === 0 ? (
                      <div className="px-3 py-3 text-sm text-neutral-500">Sem itens.</div>
                    ) : null}
                  </div>
                </div>

                {/* TOTAL + STATUS */}
                <div className="flex items-center justify-between gap-2">
                  <div className="font-extrabold text-lg">{brl(totalSelectedCalc)}</div>
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
