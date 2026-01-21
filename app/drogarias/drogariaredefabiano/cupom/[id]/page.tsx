"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

type ItemPedido = {
  produto_id?: string;
  ean?: string | null;
  nome: string;
  qtd?: number | null;
  // DRF (do seu modal)
  preco_unit?: number | null;
  total_item?: number | null;

  // compat se algum pedido antigo tiver "preco"
  preco?: number | null;
};

type Pedido = {
  id: string;
  created_at?: string | null;
  status?: string | null;

  canal?: string | null;
  comanda?: string | null;

  cliente_nome?: string | null;
  cliente_whatsapp?: string | null;

  tipo_entrega?: string | null; // ENTREGA | RETIRADA
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  complemento?: string | null;
  referencia?: string | null;

  pagamento?: string | null;

  subtotal?: number | null;
  taxa_entrega?: number | null;
  total?: number | null;

  itens?: any; // jsonb
};

function brl(n: number) {
  return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function onlyDigits(v?: string | null) {
  return (v || "").replace(/\D/g, "");
}
function safeNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function itemQtd(i: any) {
  return safeNumber(i?.qtd ?? i?.quantidade ?? 0);
}
function itemPrecoUnit(i: any) {
  return safeNumber(i?.preco_unit ?? i?.preco ?? 0);
}
function itemTotal(i: any) {
  const t = safeNumber(i?.total_item ?? 0);
  return t > 0 ? t : itemPrecoUnit(i) * itemQtd(i);
}

/* =========================
   CONFIG DRF
========================= */
const SITE = "iadrogarias.com.br";
const WHATS_DRF = "5511948343725"; // DRF
const TITULO = "Drogaria Rede Fabiano";
const SUBTIT = "Cupom de Pedido";

export default function CupomPedidoDRF() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ✅ auto-imprimir
  const AUTO_PRINT = true;

  // QR e Barcode
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  const cupomUrl = useMemo(() => {
    if (!id) return "";
    return `https://${SITE}/drogarias/drogariaredefabiano/cupom/${id}`;
  }, [id]);

  const idCurto = useMemo(() => {
    if (!pedido?.id) return "";
    return pedido.id.replace(/-/g, "").slice(0, 12).toUpperCase();
  }, [pedido?.id]);

  const totalItens = useMemo(() => {
    return itens.reduce((s, i) => s + itemQtd(i), 0);
  }, [itens]);

  const subtotalCalc = useMemo(() => {
    return itens.reduce((s, i) => s + itemTotal(i), 0);
  }, [itens]);

  async function carregarPedido(pedidoId: string) {
    setLoading(true);
    setErro(null);

    const { data: p, error: e1 } = await supabase.from("drf_pedidos").select("*").eq("id", pedidoId).single();

    if (e1 || !p) {
      console.error(e1);
      setErro("Pedido não encontrado.");
      setPedido(null);
      setItens([]);
      setLoading(false);
      return;
    }

    setPedido(p as Pedido);

    // DRF: itens ficam no jsonb do pedido
    let itensFinal: ItemPedido[] = [];
    const json = (p as any).itens;

    if (Array.isArray(json)) itensFinal = json as any;
    else if (json && Array.isArray(json?.items)) itensFinal = json.items as any;
    else itensFinal = [];

    setItens(itensFinal);
    setLoading(false);

    if (AUTO_PRINT) {
      setTimeout(() => window.print(), 350);
    }
  }

  // ✅ Gerar QR Code
  useEffect(() => {
    if (!cupomUrl) return;

    (async () => {
      try {
        const dataUrl = await QRCode.toDataURL(cupomUrl, {
          margin: 1,
          width: 180,
          errorCorrectionLevel: "M",
        });
        setQrDataUrl(dataUrl);
      } catch (e) {
        console.error("Erro QR:", e);
        setQrDataUrl("");
      }
    })();
  }, [cupomUrl]);

  // ✅ Gerar Barcode
  useEffect(() => {
    if (!barcodeSvgRef.current) return;
    if (!idCurto) return;

    try {
      JsBarcode(barcodeSvgRef.current, idCurto, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        margin: 0,
        height: 46,
      });
    } catch (e) {
      console.error("Erro barcode:", e);
    }
  }, [idCurto]);

  useEffect(() => {
    if (!id) return;
    carregarPedido(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const subtotal = safeNumber(pedido?.subtotal ?? subtotalCalc);
  const taxa = safeNumber(pedido?.taxa_entrega ?? 0);
  const total = safeNumber(pedido?.total ?? subtotal + taxa);

  const dt = pedido?.created_at ? new Date(pedido.created_at) : null;

  const whatsFormatado = useMemo(() => {
    const br = WHATS_DRF.replace(/^55/, "");
    const d = onlyDigits(br);
    if (d.length >= 11) {
      const ddd = d.slice(0, 2);
      const p1 = d.slice(2, 7);
      const p2 = d.slice(7, 11);
      return `(${ddd}) ${p1}-${p2}`;
    }
    return br;
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-3">
      <style>{`
        @media print {
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            color: #000 !important;
          }
          .paper { 
            box-shadow: none !important; 
            border: none !important; 
            margin: 0 !important; 
            color: #000 !important;
          }
          .paper * { color: #000 !important; }
          .no-print { display: none !important; }
          @page { size: 80mm auto; margin: 6mm; }
          img { max-width: 100% !important; }
          svg { max-width: 100% !important; }
        }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      `}</style>

      <div className="no-print max-w-md mx-auto mb-3 flex gap-2">
        <button onClick={() => router.back()} className="px-3 py-2 rounded bg-white border">
          ← Voltar
        </button>

        <button onClick={() => window.print()} className="px-3 py-2 rounded bg-gray-900 text-white">
          🖨️ Imprimir
        </button>

        <button onClick={() => id && carregarPedido(id)} className="px-3 py-2 rounded bg-white border">
          Atualizar
        </button>
      </div>

      {loading && (
        <div className="max-w-md mx-auto paper bg-white border rounded-xl p-4 mono text-black">
          Carregando cupom...
        </div>
      )}

      {erro && !loading && (
        <div className="max-w-md mx-auto paper bg-white border rounded-xl p-4 mono text-black">
          {erro}
        </div>
      )}

      {!loading && !erro && pedido && (
        <div className="max-w-md mx-auto paper bg-white border rounded-xl p-4 mono text-black">
          {/* CABEÇALHO */}
          <div className="text-center">
            <div className="text-lg font-extrabold text-black">{TITULO}</div>
            <div className="text-xs font-semibold text-black">{SUBTIT}</div>
          </div>

          {/* QR + BARCODE */}
          <div className="mt-3 grid grid-cols-2 gap-3 items-start">
            <div className="border rounded-lg p-2">
              <div className="text-[11px] font-bold text-black">QR do pedido</div>
              <div className="text-[10px] text-black leading-tight">Abrir cupom online</div>
              <div className="mt-2 flex justify-center">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="QR Code do pedido" className="w-[160px] h-[160px] object-contain" />
                ) : (
                  <div className="text-[11px] text-black">Gerando QR...</div>
                )}
              </div>
              <div className="mt-2 text-[10px] text-black break-all">{cupomUrl}</div>
            </div>

            <div className="border rounded-lg p-2">
              <div className="text-[11px] font-bold text-black">Código de barras</div>
              <div className="text-[10px] text-black leading-tight">Conferência rápida</div>

              <div className="mt-2">
                <svg ref={barcodeSvgRef} />
              </div>

              <div className="mt-1 text-[11px] font-extrabold text-black text-center">
                {idCurto || "-"}
              </div>
            </div>
          </div>

          <hr className="my-3 border-black" />

          {/* PEDIDO */}
          <div className="text-sm text-black">
            <div className="flex justify-between">
              <span>Pedido:</span>
              <strong>{pedido.id.slice(0, 8).toUpperCase()}</strong>
            </div>

            <div className="flex justify-between">
              <span>Status:</span>
              <strong>{pedido.status || "-"}</strong>
            </div>

            <div className="flex justify-between">
              <span>Data:</span>
              <strong>{dt ? dt.toLocaleString("pt-BR") : "-"}</strong>
            </div>

            <div className="flex justify-between">
              <span>Entrega:</span>
              <strong>{pedido.tipo_entrega || "-"}</strong>
            </div>

            <div className="flex justify-between">
              <span>Pagamento:</span>
              <strong>{pedido.pagamento || "-"}</strong>
            </div>

            {pedido.canal ? (
              <div className="flex justify-between">
                <span>Canal:</span>
                <strong>{pedido.canal}</strong>
              </div>
            ) : null}

            {pedido.comanda ? (
              <div className="flex justify-between">
                <span>Comanda:</span>
                <strong>{pedido.comanda}</strong>
              </div>
            ) : null}
          </div>

          <hr className="my-3 border-black" />

          {/* CLIENTE */}
          <div className="text-sm text-black">
            <div className="font-extrabold mb-1">Cliente</div>
            <div className="font-semibold text-black">{pedido.cliente_nome || "-"}</div>
            <div className="font-semibold text-black">{pedido.cliente_whatsapp || "-"}</div>

            {String(pedido.tipo_entrega || "").toUpperCase() === "ENTREGA" && (
              <div className="mt-2 text-xs text-black">
                <div className="font-semibold text-black">
                  {pedido.endereco || "-"}
                  {pedido.numero ? `, ${pedido.numero}` : ""}
                </div>
                <div className="font-semibold text-black">
                  {pedido.bairro ? `Bairro: ${pedido.bairro}` : ""}
                  {pedido.complemento ? ` • ${pedido.complemento}` : ""}
                </div>
                {pedido.referencia && <div className="font-semibold text-black">Ref: {pedido.referencia}</div>}
              </div>
            )}
          </div>

          <hr className="my-3 border-black" />

          {/* ITENS */}
          <div className="text-sm text-black">
            <div className="font-extrabold mb-1">Itens ({totalItens})</div>

            {itens.length === 0 ? (
              <div className="text-xs text-black">
                Sem itens (verifique se o pedido está salvando o campo <b>itens</b> no drf_pedidos).
              </div>
            ) : (
              <div className="space-y-1">
                {itens.map((i, idx) => {
                  const q = itemQtd(i);
                  const precoUn = itemPrecoUnit(i);
                  const sub = itemTotal(i);

                  return (
                    <div key={`${idx}`} className="text-xs text-black">
                      <div className="flex justify-between gap-2">
                        <span className="truncate font-semibold text-black">
                          {q}x {i.nome}
                        </span>
                        <span className="font-extrabold text-black">{brl(sub)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-black">
                        <span className="text-black">{i.ean ? `EAN: ${i.ean}` : ""}</span>
                        <span className="text-black">{precoUn ? `${brl(precoUn)} un` : ""}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr className="my-3 border-black" />

          {/* TOTAIS */}
          <div className="text-sm space-y-1 text-black">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <strong>{brl(subtotal)}</strong>
            </div>

            <div className="flex justify-between">
              <span>Taxa</span>
              <strong>{brl(taxa)}</strong>
            </div>

            <div className="flex justify-between text-base">
              <span>Total</span>
              <strong>{brl(total)}</strong>
            </div>
          </div>

          <hr className="my-3 border-black" />

          {/* RODAPÉ */}
          <div className="text-center text-xs text-black">
            <div className="font-semibold text-black">Obrigado! 💙</div>
            <div className="mt-1 font-extrabold text-black">Whats: {whatsFormatado}</div>
            <div className="mt-1 font-semibold text-black">{SITE}</div>
          </div>
        </div>
      )}
    </div>
  );
}
