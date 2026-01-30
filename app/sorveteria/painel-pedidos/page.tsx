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
  const totalCalc =
    pedido.total && Number(pedido.total) > 0 ? Number(pedido.total) : sumItens(itens);

  // ✅ Conteúdo do QR (resumo do pedido)
  const qrPayload = buildPedidoTexto({ ...pedido, total: totalCalc }, itens);

  // ✅ 3 fontes (fallback) — se uma falhar, tenta outra
  const qr1 =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
    encodeURIComponent(qrPayload);

  const qr2 =
    "https://quickchart.io/qr?size=220&text=" +
    encodeURIComponent(qrPayload);

  const qr3 =
    "https://chart.googleapis.com/chart?cht=qr&chs=220x220&chld=M|1&chl=" +
    encodeURIComponent(qrPayload);

  const itensHtml = (itens || [])
    .map((i) => {
      const nome = `${i.nome}${i.sabor ? ` (${i.sabor})` : ""}`;
      return `
        <tr>
          <td style="padding:10px 0; border-bottom:1px dashed #111;">
            <div style="font-weight:900; font-size:14px; color:#000;">
              ${escapeHtml(nome)}
            </div>
            <div style="font-size:12px; color:#111; margin-top:3px;">
              ${escapeHtml(brl(i.preco))} × ${escapeHtml(i.qty)}
              <span style="color:#666;"> • </span>
              Subtotal: <b style="color:#000;">${escapeHtml(brl(i.subtotal))}</b>
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
        *{ box-sizing:border-box; }
        body{
          margin:0;
          background:#fff;
          color:#000;
          font-family: Arial, sans-serif;
        }
        .wrap{
          padding:16px;
          display:flex;
          justify-content:center;
        }
        .card{
          width: 380px;
          border: 2px solid #000;
          border-radius: 14px;
          overflow:hidden;
        }
        .top{
          padding:14px 14px 10px 14px;
          border-bottom:2px solid #000;
        }
        .brandRow{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
        }
        .logoBox{
          width:42px;height:42px;border-radius:12px;
          border:2px solid #000;
          display:flex;align-items:center;justify-content:center;
          font-weight:900;
        }
        .title{
          font-size:18px;
          font-weight:900;
          line-height:1.1;
          color:#000;
        }
        .subtitle{
          margin-top:2px;
          font-size:12px;
          color:#111;
          font-weight:700;
        }
        .status{
          border:2px solid #000;
          padding:6px 10px;
          border-radius:999px;
          font-weight:900;
          font-size:12px;
          text-transform:uppercase;
        }
        .meta{
          margin-top:10px;
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          font-size:12px;
        }
        .pill{
          border:1px solid #000;
          padding:6px 10px;
          border-radius:999px;
          font-weight:800;
        }
        .section{
          padding:12px 14px;
          border-bottom:2px solid #000;
        }
        .label{ font-size:11px; color:#111; font-weight:800; }
        .value{ font-size:13px; color:#000; font-weight:900; }
        .value2{ font-size:12px; color:#111; font-weight:700; margin-top:2px; }
        .grid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:8px;
        }
        .full{ grid-column:1/-1; }
        .itemsTitle{
          font-size:12px;
          font-weight:900;
          letter-spacing:.08em;
          text-transform:uppercase;
          margin-bottom:8px;
        }
        table{ width:100%; border-collapse:collapse; }
        .totalBox{
          padding:12px 14px;
          display:flex;
          justify-content:space-between;
          align-items:flex-end;
        }
        .totalLabel{
          font-size:12px;
          font-weight:900;
          color:#111;
        }
        .totalValue{
          font-size:20px;
          font-weight:900;
          color:#000;
        }
        .qrWrap{
          padding:12px 14px;
          display:flex;
          gap:12px;
          align-items:center;
        }
        .qr{
          width:120px;height:120px;
          border:2px solid #000;
          border-radius:14px;
          overflow:hidden;
          display:flex;align-items:center;justify-content:center;
          background:#fff;
        }
        .qr img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }
        .qrText .h{
          font-weight:900;
          color:#000;
          margin-bottom:4px;
        }
        .qrText .p{
          font-size:12px;
          color:#111;
          font-weight:700;
          line-height:1.35;
        }
        .footer{
          padding:10px 14px 14px 14px;
          text-align:center;
          font-size:11px;
          color:#111;
          font-weight:800;
        }

        /* impressão: força contraste (fundo branco, texto preto) */
        @media print{
          body{ background:#fff !important; color:#000 !important; }
          .wrap{ padding:0; }
          .card{ width:100%; border-radius:0; }
        }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="card">

          <div class="top">
            <div class="brandRow">
              <div style="display:flex; align-items:center; gap:10px;">
                <div class="logoBox">OGG</div>
                <div>
                  <div class="title">Sorveteria Oggi</div>
                  <div class="subtitle">IA Drogarias • Recibo do Pedido</div>
                </div>
              </div>
              <div class="status">${escapeHtml(pedido.status || "novo")}</div>
            </div>

            <div class="meta">
              <div class="pill"><b>Pedido:</b>&nbsp;${escapeHtml(pedido.codigo)}</div>
              <div class="pill"><b>Data:</b>&nbsp;${escapeHtml(dtBR(pedido.created_at))}</div>
            </div>
          </div>

          <div class="section">
            <div class="grid">
              <div>
                <div class="label">Cliente</div>
                <div class="value">${escapeHtml(pedido.cliente_nome || "-")}</div>
              </div>
              <div>
                <div class="label">Pagamento</div>
                <div class="value">${escapeHtml(pedido.pagamento || "-")}</div>
              </div>

              <div class="full">
                <div class="label">Endereço</div>
                <div class="value2">${escapeHtml(pedido.endereco || "-")}</div>
              </div>

              <div>
                <div class="label">Bairro</div>
                <div class="value2">${escapeHtml(pedido.bairro || "-")}</div>
              </div>
              <div>
                <div class="label">Obs</div>
                <div class="value2">${escapeHtml(pedido.obs || "-")}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="itemsTitle">Itens do Pedido</div>
            <table>
              ${itensHtml || `<tr><td style="padding:10px 0; font-weight:800; color:#111;">Sem itens.</td></tr>`}
            </table>
          </div>

          <div class="totalBox">
            <div class="totalLabel">TOTAL</div>
            <div class="totalValue">${escapeHtml(brl(totalCalc))}</div>
          </div>

          <div class="qrWrap">
            <div class="qr">
              <img id="qrImg" src="${qr1}" alt="QR Code do Pedido" />
            </div>
            <div class="qrText">
              <div class="h">QR do pedido</div>
              <div class="p">
                Escaneie para ver o resumo completo.<br/>
                (confere itens, total e endereço)
              </div>
            </div>
          </div>

          <div class="footer">
            Obrigado pela preferência 💜 • Sorveteria Oggi • IA Drogarias
          </div>
        </div>
      </div>

      <script>
        (function(){
          var img = document.getElementById("qrImg");
          if(!img) return;

          var fallbacks = ["${qr2}", "${qr3}"];
          var idx = 0;

          img.onerror = function(){
            if(idx < fallbacks.length){
              img.src = fallbacks[idx++];
            }
          };

          // Espera um pouco para o QR carregar antes de imprimir
          // (evita sair sem imagem em impressoras lentas)
          window.onload = function(){
            setTimeout(function(){ window.print(); }, 450);
          };
        })();
      </script>
    </body>
  </html>
  `;

  const w = window.open("", "_blank", "width=420,height=820");
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
