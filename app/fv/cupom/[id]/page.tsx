"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ItemPedido = {
  id?: string;
  nome: string;
  qtd?: number; // FV
  quantidade?: number; // fallback
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

  itens?: any;
};

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

export default function CupomPedidoFV() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ✅ se quiser auto-imprimir ao abrir o cupom:
  const AUTO_PRINT = true;

  const totalItens = useMemo(() => {
    return itens.reduce((s, i) => {
      const q = safeNumber((i as any).qtd ?? (i as any).quantidade ?? 0);
      return s + q;
    }, 0);
  }, [itens]);

  const subtotalCalc = useMemo(() => {
    const sum = itens.reduce((s, i) => {
      const q = safeNumber((i as any).qtd ?? (i as any).quantidade ?? 0);
      const sub =
        i.subtotal !== null && i.subtotal !== undefined
          ? safeNumber(i.subtotal)
          : safeNumber(i.preco) * q;
      return s + sub;
    }, 0);
    return sum;
  }, [itens]);

  async function carregarPedidoEItens(pedidoId: string) {
    setLoading(true);
    setErro(null);

    const { data: p, error: e1 } = await supabase
      .from("fv_pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (e1 || !p) {
      console.error(e1);
      setErro("Pedido não encontrado.");
      setPedido(null);
      setItens([]);
      setLoading(false);
      return;
    }

    setPedido(p as Pedido);

    let itensFinal: ItemPedido[] = [];

    try {
      const { data: its, error: e2 } = await supabase
        .from("fv_pedido_itens")
        .select("id,nome,ean,qtd,preco,subtotal")
        .eq("pedido_id", pedidoId)
        .order("id", { ascending: true });

      if (!e2 && its && its.length) {
        itensFinal = its as any;
      } else {
        const json = (p as any).itens;
        if (Array.isArray(json)) itensFinal = json as any;
        else if (json && Array.isArray(json?.items)) itensFinal = json.items as any;
        else itensFinal = [];
      }
    } catch (err) {
      const json = (p as any).itens;
      if (Array.isArray(json)) itensFinal = json as any;
      else if (json && Array.isArray(json?.items)) itensFinal = json.items as any;
      else itensFinal = [];
    }

    setItens(itensFinal);
    setLoading(false);

    if (AUTO_PRINT) {
      setTimeout(() => window.print(), 350);
    }
  }

  useEffect(() => {
    if (!id) return;
    carregarPedidoEItens(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const subtotal = safeNumber(pedido?.subtotal ?? subtotalCalc);
  const taxa = safeNumber(pedido?.taxa_entrega ?? 0);
  const total = safeNumber(pedido?.total ?? subtotal + taxa);

  const dt = pedido?.created_at ? new Date(pedido.created_at) : null;

  return (
    <div className="min-h-screen bg-zinc-100 p-3">
      {/* CSS de impressão (cupom 80mm) */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .paper { box-shadow: none !important; border: none !important; margin: 0 !important; }
          @page { size: 80mm auto; margin: 6mm; }
        }
        .mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        .hr-strong {
          border: none;
          border-top: 2px solid rgba(0,0,0,.55);
          margin: 10px 0;
        }
      `}</style>

      <div className="no-print max-w-md mx-auto mb-3 flex gap-2">
        <button
          onClick={() => router.back()}
          className="px-3 py-2 rounded bg-white border border-zinc-300"
        >
          ← Voltar
        </button>

        <button
          onClick={() => window.print()}
          className="px-3 py-2 rounded bg-black text-white font-extrabold"
        >
          🖨️ Imprimir
        </button>

        <button
          onClick={() => id && carregarPedidoEItens(id)}
          className="px-3 py-2 rounded bg-white border border-zinc-300"
        >
          Atualizar
        </button>
      </div>

      {loading && (
        <div className="max-w-md mx-auto paper bg-white border border-zinc-300 rounded-xl p-4 mono text-black">
          <div className="font-black">Carregando cupom…</div>
        </div>
      )}

      {erro && !loading && (
        <div className="max-w-md mx-auto paper bg-white border border-zinc-300 rounded-xl p-4 mono text-black">
          <div className="font-black">{erro}</div>
        </div>
      )}

      {!loading && !erro && pedido && (
        <div className="max-w-md mx-auto paper bg-white border border-zinc-300 rounded-xl p-4 mono text-black">
          {/* Cabeçalho */}
          <div className="text-center">
            <div className="text-xl font-black tracking-tight">IA DROGARIAS • FV</div>
            <div className="text-[12px] font-bold">CUPOM DE PEDIDO</div>
          </div>

          <hr className="hr-strong" />

          {/* Pedido */}
          <div className="text-[13px] leading-5">
            <div className="flex justify-between">
              <span className="font-bold">Pedido:</span>
              <span className="font-black">{pedido.id.slice(0, 8).toUpperCase()}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-bold">Status:</span>
              <span className="font-black">{pedido.status || "-"}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-bold">Data:</span>
              <span className="font-black">{dt ? dt.toLocaleString("pt-BR") : "-"}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-bold">Entrega:</span>
              <span className="font-black">{pedido.tipo_entrega || "-"}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-bold">Pagamento:</span>
              <span className="font-black">{pedido.pagamento || "-"}</span>
            </div>
          </div>

          <hr className="hr-strong" />

          {/* Cliente */}
          <div className="text-[13px] leading-5">
            <div className="font-black mb-1">CLIENTE</div>
            <div className="font-bold">{pedido.cliente_nome || "-"}</div>
            <div className="font-bold">{pedido.cliente_whatsapp || "-"}</div>

            {String(pedido.tipo_entrega || "").toUpperCase() === "ENTREGA" && (
              <div className="mt-2 text-[12px] leading-4">
                <div className="font-bold">
                  {pedido.endereco || "-"}
                  {pedido.numero ? `, ${pedido.numero}` : ""}
                </div>
                <div className="font-bold">
                  {pedido.bairro ? `Bairro: ${pedido.bairro}` : ""}
                  {pedido.complemento ? ` • ${pedido.complemento}` : ""}
                </div>
                {pedido.referencia && <div className="font-bold">Ref: {pedido.referencia}</div>}
              </div>
            )}
          </div>

          <hr className="hr-strong" />

          {/* Itens */}
          <div className="text-[13px]">
            <div className="font-black mb-2">ITENS ({totalItens})</div>

            {itens.length === 0 ? (
              <div className="text-[12px] font-bold">
                Sem itens (verifique se está salvando itens no pedido ou criando fv_pedido_itens).
              </div>
            ) : (
              <div className="space-y-2">
                {itens.map((i, idx) => {
                  const q = safeNumber((i as any).qtd ?? (i as any).quantidade ?? 0);
                  const preco = safeNumber(i.preco);
                  const sub =
                    i.subtotal !== null && i.subtotal !== undefined
                      ? safeNumber(i.subtotal)
                      : preco * q;

                  return (
                    <div key={i.id || `${idx}`} className="pb-1 border-b border-black/30">
                      <div className="flex justify-between gap-2">
                        <span className="truncate font-bold">
                          {q}x {i.nome}
                        </span>
                        <span className="font-black">{brl(sub)}</span>
                      </div>

                      <div className="flex justify-between text-[12px]">
                        <span className="font-bold">{i.ean ? `EAN: ${i.ean}` : ""}</span>
                        <span className="font-bold">{preco ? `${brl(preco)} un` : ""}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr className="hr-strong" />

          {/* Totais */}
          <div className="text-[13px] space-y-1">
            <div className="flex justify-between">
              <span className="font-bold">Subtotal</span>
              <span className="font-black">{brl(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-bold">Taxa</span>
              <span className="font-black">{brl(taxa)}</span>
            </div>

            <div className="flex justify-between text-[16px]">
              <span className="font-black">TOTAL</span>
              <span className="font-black">{brl(total)}</span>
            </div>
          </div>

          <hr className="hr-strong" />

          {/* Rodapé */}
          <div className="text-center text-[12px] font-bold">
            Obrigado! 💙
            <div className="mt-1">
              Whats: {pedido.cliente_whatsapp ? onlyDigits(pedido.cliente_whatsapp) : "-"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
