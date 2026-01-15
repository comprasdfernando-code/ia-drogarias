"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

/* =========================
   TIPOS
========================= */
type ItemPedido = {
  id?: string;
  nome: string;
  qtd?: number;
  quantidade?: number;
  preco: number;
  subtotal?: number | null;
  ean?: string | null;
};

type Pedido = {
  id: string;
  created_at?: string | null;
  status?: string | null;

  cliente_nome?: string | null;
  cliente_whatsapp?: string | null;

  tipo_entrega?: string | null;
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  complemento?: string | null;
  referencia?: string | null;

  pagamento?: string | null;

  subtotal?: number | null;
  taxa_entrega?: number | null;
  total?: number | null;

  itens?: any;
};

/* =========================
   HELPERS
========================= */
function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function onlyDigits(v?: string | null) {
  return (v || "").replace(/\D/g, "");
}
function safeNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const WHATS_FV = "5511952068432";
const SITE = "iadrogarias.com.br";

/* =========================
   PAGE
========================= */
export default function CupomPedidoFV() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [qrDataUrl, setQrDataUrl] = useState("");
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  const AUTO_PRINT = true;

  const cupomUrl = useMemo(() => {
    if (!id) return "";
    return `https://${SITE}/fv/cupom/${id}`;
  }, [id]);

  const idCurto = useMemo(() => {
    if (!pedido?.id) return "";
    return pedido.id.replace(/-/g, "").slice(0, 12).toUpperCase();
  }, [pedido?.id]);

  const totalItens = useMemo(() => {
    return itens.reduce((s, i) => {
      const q = safeNumber((i as any).qtd ?? (i as any).quantidade ?? 0);
      return s + q;
    }, 0);
  }, [itens]);

  const subtotalCalc = useMemo(() => {
    return itens.reduce((s, i) => {
      const q = safeNumber((i as any).qtd ?? (i as any).quantidade ?? 0);
      const sub =
        i.subtotal !== null && i.subtotal !== undefined
          ? safeNumber(i.subtotal)
          : safeNumber(i.preco) * q;
      return s + sub;
    }, 0);
  }, [itens]);

  async function carregarPedidoEItens(pedidoId: string) {
    setLoading(true);
    setErro(null);

    const { data: p, error } = await supabase
      .from("fv_pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (error || !p) {
      setErro("Pedido não encontrado.");
      setPedido(null);
      setItens([]);
      setLoading(false);
      return;
    }

    setPedido(p as Pedido);

    let itensFinal: ItemPedido[] = [];

    try {
      const { data: its } = await supabase
        .from("fv_pedido_itens")
        .select("id,nome,ean,qtd,preco,subtotal")
        .eq("pedido_id", pedidoId)
        .order("id");

      if (its && its.length) {
        itensFinal = its as any;
      } else {
        const json = (p as any).itens;
        if (Array.isArray(json)) itensFinal = json;
        else if (json?.items && Array.isArray(json.items)) itensFinal = json.items;
      }
    } catch {
      const json = (p as any).itens;
      if (Array.isArray(json)) itensFinal = json;
      else if (json?.items && Array.isArray(json.items)) itensFinal = json.items;
    }

    setItens(itensFinal);
    setLoading(false);

    if (AUTO_PRINT) {
      setTimeout(() => window.print(), 350);
    }
  }

  /* QR */
  useEffect(() => {
    if (!cupomUrl) return;
    QRCode.toDataURL(cupomUrl, { width: 180, margin: 1 }).then(setQrDataUrl);
  }, [cupomUrl]);

  /* BARCODE */
  useEffect(() => {
    if (!barcodeSvgRef.current || !idCurto) return;
    JsBarcode(barcodeSvgRef.current, idCurto, {
      format: "CODE128",
      displayValue: true,
      fontSize: 14,
      height: 46,
      margin: 0,
    });
  }, [idCurto]);

  useEffect(() => {
    if (id) carregarPedidoEItens(id);
  }, [id]);

  const subtotal = safeNumber(pedido?.subtotal ?? subtotalCalc);
  const taxa = safeNumber(pedido?.taxa_entrega ?? 0);
  const total = safeNumber(pedido?.total ?? subtotal + taxa);

  const dt = pedido?.created_at ? new Date(pedido.created_at) : null;

  const whatsFmt = useMemo(() => {
    const d = onlyDigits(WHATS_FV.replace(/^55/, ""));
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-3 text-black">
      <style>{`
        @media print {
          body { color: #000 !important; }
          .no-print { display: none !important; }
          .paper { border: none !important; box-shadow: none !important; }
          @page { size: 80mm auto; margin: 6mm; }
        }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        }
      `}</style>

      {!loading && pedido && (
        <div className="max-w-md mx-auto paper bg-white border rounded-xl p-4 mono">
          {/* CABEÇALHO */}
          <div className="text-center">
            <div className="text-lg font-extrabold">IA Drogarias • FV</div>
            <div className="text-xs font-bold">Cupom de Pedido</div>
          </div>

          {/* QR + BARCODE */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="border p-2 rounded">
              <div className="text-xs font-bold">QR do Pedido</div>
              {qrDataUrl && <img src={qrDataUrl} className="mx-auto mt-2" />}
              <div className="text-[10px] break-all font-bold">{cupomUrl}</div>
            </div>

            <div className="border p-2 rounded text-center">
              <div className="text-xs font-bold">Código de Barras</div>
              <svg ref={barcodeSvgRef} />
              <div className="text-xs font-extrabold">{idCurto}</div>
            </div>
          </div>

          <hr className="my-3 border-black" />

          {/* PEDIDO */}
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span>Pedido</span><strong>{pedido.id.slice(0,8)}</strong></div>
            <div className="flex justify-between"><span>Status</span><strong>{pedido.status}</strong></div>
            <div className="flex justify-between"><span>Data</span><strong>{dt?.toLocaleString("pt-BR")}</strong></div>
            <div className="flex justify-between"><span>Entrega</span><strong>{pedido.tipo_entrega}</strong></div>
            <div className="flex justify-between"><span>Pagamento</span><strong>{pedido.pagamento}</strong></div>
          </div>

          <hr className="my-3 border-black" />

          {/* CLIENTE */}
          <div className="text-sm">
            <div className="font-extrabold">Cliente</div>
            <div className="font-bold">{pedido.cliente_nome}</div>
            <div className="font-bold">{pedido.cliente_whatsapp}</div>

            {pedido.tipo_entrega === "ENTREGA" && (
              <div className="mt-1 font-bold text-xs">
                {pedido.endereco}, {pedido.numero} – {pedido.bairro}<br />
                {pedido.complemento} {pedido.referencia && `• Ref: ${pedido.referencia}`}
              </div>
            )}
          </div>

          <hr className="my-3 border-black" />

          {/* ITENS */}
          <div className="text-sm">
            <div className="font-extrabold">Itens ({totalItens})</div>
            {itens.map((i, idx) => {
              const q = safeNumber((i as any).qtd ?? (i as any).quantidade ?? 0);
              const sub = safeNumber(i.subtotal ?? i.preco * q);
              return (
                <div key={idx} className="flex justify-between text-xs font-bold">
                  <span>{q}x {i.nome}</span>
                  <span>{brl(sub)}</span>
                </div>
              );
            })}
          </div>

          <hr className="my-3 border-black" />

          {/* TOTAIS */}
          <div className="text-sm font-bold">
            <div className="flex justify-between"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
            <div className="flex justify-between"><span>Taxa</span><span>{brl(taxa)}</span></div>
            <div className="flex justify-between text-base"><span>Total</span><span>{brl(total)}</span></div>
          </div>

          <hr className="my-3 border-black" />

          {/* RODAPÉ */}
          <div className="text-center text-xs font-bold">
            Obrigado! 💙<br />
            Whats: {whatsFmt}<br />
            {SITE}
          </div>
        </div>
      )}
    </div>
  );
}
