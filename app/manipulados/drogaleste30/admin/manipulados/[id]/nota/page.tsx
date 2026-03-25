"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PedidoManipulado = {
  id: string;
  loja?: string | null;
  req?: string | null;
  created_at?: string | null;
  data_solicitacao?: string | null;
  data_recebimento?: string | null;
  data_disponivel_retirada?: string | null;
  data_dispensa?: string | null;
  status?: string | null;

  cliente_nome?: string | null;
  cliente_telefone?: string | null;
  cliente_endereco?: string | null;

  tipo_recebimento?: string | null;

  formula?: string | null;
  apresentacao?: string | null;

  valor?: number | null;
  pago?: boolean | null;

  observacoes?: string | null;
  observacao_interna?: string | null;

  solicitado_por?: string | null;
  recebido_por?: string | null;
  dispensado_por?: string | null;

  receita_url?: string | null;
  comprovante_url?: string | null;
};

function brl(n: number) {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function safeNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function onlyDigits(v?: string | null) {
  return (v || "").replace(/\D/g, "");
}

function formatarData(v?: string | null) {
  if (!v) return "-";
  const dt = new Date(v);
  if (Number.isNaN(dt.getTime())) return String(v);
  return dt.toLocaleString("pt-BR");
}

function statusLabel(status?: string | null) {
  switch (status) {
    case "solicitado_manipulacao":
      return "Solicitado";
    case "em_producao":
      return "Em produção";
    case "chegou_loja":
      return "Chegou na loja";
    case "disponivel_retirada":
      return "Disponível para retirada";
    case "retirado":
      return "Retirado";
    case "cancelado":
      return "Cancelado";
    default:
      return status || "-";
  }
}

function tipoRecebimentoLabel(tipo?: string | null) {
  switch (tipo) {
    case "entrega":
      return "Entrega";
    case "retirada":
      return "Retirada na loja";
    default:
      return tipo || "-";
  }
}

const LOJA_PADRAO = "Droga Leste 30";
const WHATS_LOJA = "5511953996537";
const SITE = "iadrogarias.com.br";

export default function NotaManipuladoCupomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [pedido, setPedido] = useState<PedidoManipulado | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const AUTO_PRINT = false;

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  const lojaNome = pedido?.loja || LOJA_PADRAO;

  const cupomUrl = useMemo(() => {
    if (!id) return "";
    return `https://${SITE}/manipulados/drogaleste30/admin/manipulados/${id}/nota`;
  }, [id]);

  const idCurto = useMemo(() => {
    if (!pedido?.id) return "";
    return pedido.id.replace(/-/g, "").slice(0, 12).toUpperCase();
  }, [pedido?.id]);

  async function carregarPedido(pedidoId: string) {
    setLoading(true);
    setErro(null);

    const { data, error } = await supabase
      .from("manipulados_pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (error || !data) {
      console.error(error);
      setErro("Pedido não encontrado.");
      setPedido(null);
      setLoading(false);
      return;
    }

    setPedido(data as PedidoManipulado);
    setLoading(false);

    if (AUTO_PRINT) {
      setTimeout(() => window.print(), 350);
    }
  }

  useEffect(() => {
    if (!id) return;
    carregarPedido(id);
  }, [id]);

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

  const total = safeNumber(pedido?.valor ?? 0);
  const dataBase = pedido?.data_solicitacao || pedido?.created_at || null;

  const whatsFormatado = useMemo(() => {
    const br = WHATS_LOJA.replace(/^55/, "");
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
          .paper * {
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: 80mm auto;
            margin: 6mm;
          }
          img, svg {
            max-width: 100% !important;
          }
        }

        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
      `}</style>

      <div className="no-print max-w-md mx-auto mb-3 flex gap-2">
        <button
          onClick={() => router.back()}
          className="px-3 py-2 rounded bg-white border"
        >
          ← Voltar
        </button>

        <button
          onClick={() => window.print()}
          className="px-3 py-2 rounded bg-gray-900 text-white"
        >
          🖨️ Imprimir
        </button>

        <button
          onClick={() => id && carregarPedido(id)}
          className="px-3 py-2 rounded bg-white border"
        >
          Atualizar
        </button>

        <Link
          href={`/manipulados/drogaleste30/admin/manipulados/${id}`}
          className="px-3 py-2 rounded bg-white border"
        >
          Pedido
        </Link>
      </div>

      {loading && (
        <div className="max-w-md mx-auto paper bg-white border rounded-xl p-4 mono text-black">
          Carregando nota...
        </div>
      )}

      {erro && !loading && (
        <div className="max-w-md mx-auto paper bg-white border rounded-xl p-4 mono text-black">
          {erro}
        </div>
      )}

      {!loading && !erro && pedido && (
        <div className="max-w-md mx-auto paper bg-white border rounded-xl p-4 mono text-black">
          <div className="text-center">
            <div className="text-lg font-extrabold text-black">
              {lojaNome}
            </div>
            <div className="text-xs font-semibold text-black">
              Nota de Entrega / Retirada
            </div>
            <div className="mt-2 text-xs font-extrabold text-black">
              Manipulados
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 items-start">
            <div className="border rounded-lg p-2">
              <div className="text-[11px] font-bold text-black">QR da nota</div>
              <div className="text-[10px] text-black leading-tight">
                Abrir nota online
              </div>
              <div className="mt-2 flex justify-center">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="QR Code da nota"
                    className="w-[160px] h-[160px] object-contain"
                  />
                ) : (
                  <div className="text-[11px] text-black">Gerando QR...</div>
                )}
              </div>
              <div className="mt-2 text-[10px] text-black break-all">
                {cupomUrl}
              </div>
            </div>

            <div className="border rounded-lg p-2">
              <div className="text-[11px] font-bold text-black">
                Código de barras
              </div>
              <div className="text-[10px] text-black leading-tight">
                Conferência rápida
              </div>
              <div className="mt-2">
                <svg ref={barcodeSvgRef} />
              </div>
              <div className="mt-1 text-[11px] font-extrabold text-black text-center">
                {idCurto || "-"}
              </div>
            </div>
          </div>

          <hr className="my-3 border-black" />

          <div className="text-sm text-black">
            <div className="flex justify-between">
              <span>Pedido:</span>
              <strong>{pedido.id.slice(0, 8).toUpperCase()}</strong>
            </div>
            <div className="flex justify-between">
              <span>REQ:</span>
              <strong>{pedido.req || "-"}</strong>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <strong>{statusLabel(pedido.status)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Data:</span>
              <strong>{formatarData(dataBase)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Recebimento:</span>
              <strong>{tipoRecebimentoLabel(pedido.tipo_recebimento)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Pago:</span>
              <strong>{pedido.pago ? "Sim" : "Não"}</strong>
            </div>
          </div>

          <hr className="my-3 border-black" />

          <div className="text-sm text-black">
            <div className="font-extrabold mb-1">Cliente</div>
            <div className="font-semibold text-black">
              {pedido.cliente_nome || "-"}
            </div>
            <div className="font-semibold text-black">
              {pedido.cliente_telefone || "-"}
            </div>

            {pedido.cliente_endereco && (
              <div className="mt-2 text-xs text-black">
                <div className="font-semibold text-black">
                  {pedido.cliente_endereco}
                </div>
              </div>
            )}
          </div>

          <hr className="my-3 border-black" />

          <div className="text-sm text-black">
            <div className="font-extrabold mb-1">Fórmula</div>

            <div className="space-y-1">
              <div className="text-xs text-black">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-black">
                    1x {pedido.formula || "-"}
                  </span>
                  <span className="font-extrabold text-black">
                    {brl(total)}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-black">
                  <span className="text-black">
                    Apresentação: {pedido.apresentacao || "-"}
                  </span>
                  <span className="text-black">
                    {pedido.pago ? "Pago" : "Pendente"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-3 border-black" />

          <div className="text-sm text-black">
            <div className="font-extrabold mb-1">Responsáveis</div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Solicitado por</span>
                <strong>{pedido.solicitado_por || "-"}</strong>
              </div>
              <div className="flex justify-between">
                <span>Recebido por</span>
                <strong>{pedido.recebido_por || "-"}</strong>
              </div>
              <div className="flex justify-between">
                <span>Dispensado por</span>
                <strong>{pedido.dispensado_por || "-"}</strong>
              </div>
            </div>
          </div>

          <hr className="my-3 border-black" />

          <div className="text-sm text-black">
            <div className="font-extrabold mb-1">Datas do fluxo</div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Solicitação</span>
                <strong>{formatarData(pedido.data_solicitacao)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Recebimento</span>
                <strong>{formatarData(pedido.data_recebimento)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Disponível</span>
                <strong>{formatarData(pedido.data_disponivel_retirada)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Dispensa</span>
                <strong>{formatarData(pedido.data_dispensa)}</strong>
              </div>
            </div>
          </div>

          <hr className="my-3 border-black" />

          <div className="text-sm text-black">
            <div className="font-extrabold mb-1">Observações</div>
            <div className="text-xs text-black whitespace-pre-wrap">
              {pedido.observacoes || "Sem observações."}
            </div>

            {pedido.observacao_interna && (
              <>
                <div className="mt-3 font-extrabold mb-1">Observação interna</div>
                <div className="text-xs text-black whitespace-pre-wrap">
                  {pedido.observacao_interna}
                </div>
              </>
            )}
          </div>

          <hr className="my-3 border-black" />

          <div className="text-sm space-y-1 text-black">
            <div className="flex justify-between text-base">
              <span>Total</span>
              <strong>{brl(total)}</strong>
            </div>
          </div>

          <hr className="my-3 border-black" />

          <div className="text-xs text-black">
            <div className="font-extrabold mb-1">Arquivos</div>
            <div className="flex justify-between">
              <span>Receita anexada</span>
              <strong>{pedido.receita_url ? "Sim" : "Não"}</strong>
            </div>
            <div className="flex justify-between">
              <span>Comprovante anexado</span>
              <strong>{pedido.comprovante_url ? "Sim" : "Não"}</strong>
            </div>
          </div>

          <hr className="my-3 border-black" />

          <div className="mt-4 text-xs text-black space-y-5">
            <div>
              <div className="font-semibold text-black mb-5">
                Assinatura do responsável
              </div>
              <div className="border-b border-black w-full" />
            </div>

            <div>
              <div className="font-semibold text-black mb-5">
                Assinatura do cliente / recebedor
              </div>
              <div className="border-b border-black w-full" />
            </div>
          </div>

          <hr className="my-3 border-black" />

          <div className="text-center text-xs text-black">
            <div className="font-semibold text-black">Obrigado! 💙</div>
            <div className="mt-1 font-extrabold text-black">
              Whats: {whatsFormatado}
            </div>
            <div className="mt-1 font-semibold text-black">{SITE}</div>
          </div>
        </div>
      )}
    </div>
  );
} \















































