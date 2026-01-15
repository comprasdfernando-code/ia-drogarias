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

  // pode existir como json
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
    // se item tiver subtotal use, senão calcula
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

    // 1) Busca pedido
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

    // 2) Tenta relacionamento (se existir tabela de itens)
    //    Se não existir, cai no JSON.
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
        // fallback JSON
        const json = (p as any).itens;
        if (Array.isArray(json)) itensFinal = json as any;
        else if (json && Array.isArray(json?.items)) itensFinal = json.items as any;
        else itensFinal = [];
      }
    } catch (err) {
      // fallback JSON se a tabela nem existir
      const json = (p as any).itens;
      if (Array.isArray(json)) itensFinal = json as any;
      else if (json && Array.isArray(json?.items)) itensFinal = json.items as any;
      else itensFinal = [];
    }

    setItens(itensFinal);
    setLoading(false);

    if (AUTO_PRINT) {
      // dá um respiro pro layout renderizar
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
    <div className="min-h-screen bg-gray-100 p-3">
      {/* CSS de impressão (cupom 80mm) */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .paper { box-shadow: none !important; border: none !important; margin: 0 !important; }
          @page { size: 80mm auto; margin: 6mm; }
        }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
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
          onClick={() => id && carregarPedidoEItens(id)}
          className="px-3 py-2 rounded bg-white border"
        >
          Atualizar
        </button>
      </div>

      {loading && (
        <div className="max-w-md mx-auto paper bg-white border rounded-xl p-4 mono">
          Carregando cupom...
        </div>
      )}

      {erro && !loading && (
        <div className="max-w-md mx-auto paper bg-white border rounded-xl p-4 mono">
          {erro}
        </div>
      )}

      {!loading && !erro && pedido && (
        <div className="max-w-md mx-auto paper bg-white border rounded-xl p-4 mono">
          {/* Cabeçalho */}
          <div className="text-center">
            <div className="text-lg font-bold">IA Drogarias • FV</div>
            <div className="text-xs text-gray-600">
              Cupom de Pedido
            </div>
          </div>

          <hr className="my-3" />

          {/* Pedido */}
          <div className="text-sm">
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
          </div>

          <hr className="my-3" />

          {/* Cliente */}
          <div className="text-sm">
            <div className="font-bold mb-1">Cliente</div>
            <div>{pedido.cliente_nome || "-"}</div>
            <div>{pedido.cliente_whatsapp || "-"}</div>

            {String(pedido.tipo_entrega || "").toUpperCase() === "ENTREGA" && (
              <div className="mt-2 text-xs text-gray-700">
                <div>
                  {pedido.endereco || "-"}
                  {pedido.numero ? `, ${pedido.numero}` : ""}
                </div>
                <div>
                  {pedido.bairro ? `Bairro: ${pedido.bairro}` : ""}
                  {pedido.complemento ? ` • ${pedido.complemento}` : ""}
                </div>
                {pedido.referencia && <div>Ref: {pedido.referencia}</div>}
              </div>
            )}
          </div>

          <hr className="my-3" />

          {/* Itens */}
          <div className="text-sm">
            <div className="font-bold mb-1">Itens ({totalItens})</div>

            {itens.length === 0 ? (
              <div className="text-xs text-gray-600">
                Sem itens (verifique se está salvando itens no pedido ou criando fv_pedido_itens).
              </div>
            ) : (
              <div className="space-y-1">
                {itens.map((i, idx) => {
                  const q = safeNumber((i as any).qtd ?? (i as any).quantidade ?? 0);
                  const preco = safeNumber(i.preco);
                  const sub =
                    i.subtotal !== null && i.subtotal !== undefined
                      ? safeNumber(i.subtotal)
                      : preco * q;

                  return (
                    <div key={i.id || `${idx}`} className="text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="truncate">
                          {q}x {i.nome}
                        </span>
                        <span className="font-bold">{brl(sub)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-600">
                        <span>{i.ean ? `EAN: ${i.ean}` : ""}</span>
                        <span>{preco ? `${brl(preco)} un` : ""}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr className="my-3" />

          {/* Totais */}
          <div className="text-sm space-y-1">
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

          <hr className="my-3" />

          {/* Rodapé */}
          <div className="text-center text-xs text-gray-600">
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
