"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CupomPedido({ params }: { params: { id: string } }) {
  const [venda, setVenda] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      setLoading(true);

      const { data: v, error: ev } = await supabase
        .from("gigante_vendas")
        .select("*")
        .eq("id", params.id)
        .single();

      const { data: its, error: ei } = await supabase
        .from("gigante_venda_itens")
        .select("nome,quantidade,preco,subtotal")
        .eq("venda_id", params.id)
        .order("criado_em", { ascending: true });

      if (!ev) setVenda(v);
      if (!ei) setItens(its || []);

      setLoading(false);

      // auto print
      setTimeout(() => window.print(), 400);
    }

    carregar();
  }, [params.id]);

  const total = useMemo(() => Number(venda?.total || 0), [venda]);

  if (loading) return <div className="p-4">Carregando cupom...</div>;
  if (!venda) return <div className="p-4">Pedido não encontrado.</div>;

  return (
    <div className="p-0 m-0">
      <style>{`
        @media print {
          @page { margin: 0; }
          body { margin: 0; }
          .no-print { display: none !important; }
        }
        .cupom {
          width: 58mm;
          font-family: ui-monospace, Menlo, Monaco, Consolas, "Courier New", monospace;
          font-size: 12px;
          line-height: 1.25;
          padding: 8px;
        }
        .center { text-align: center; }
        .hr { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; gap: 8px; }
        .bold { font-weight: 700; }
      `}</style>

      <div className="cupom">
        <div className="center bold" style={{ fontSize: 14 }}>
          Gigante dos Assados
        </div>
        <div className="center">Pedido {String(venda.id).slice(0, 6).toUpperCase()}</div>
        <div className="center">{new Date(venda.data).toLocaleString("pt-BR")}</div>

        <div className="hr" />

        {itens.map((i, idx) => (
          <div key={idx} className="row">
            <span>
              {i.quantidade}x {i.nome}
            </span>
            <span>{brl(Number(i.subtotal ?? i.preco * i.quantidade))}</span>
          </div>
        ))}

        <div className="hr" />

        <div className="row">
          <span>Subtotal</span>
          <span>{brl(Number(venda.subtotal || 0))}</span>
        </div>
        <div className="row">
          <span>Frete</span>
          <span>{brl(Number(venda.frete || 0))}</span>
        </div>

        <div className="row bold" style={{ fontSize: 13 }}>
          <span>Total</span>
          <span>{brl(total)}</span>
        </div>

        <div className="hr" />

        <div className="row">
          <span>Recebimento</span>
          <span className="bold">{venda.tipo_entrega}</span>
        </div>
        <div className="row">
          <span>Pagamento</span>
          <span className="bold">{venda.metodo_pagamento}</span>
        </div>

        {venda.tipo_entrega === "entrega" && (
          <>
            <div className="hr" />
            <div className="bold">ENTREGA</div>
            <div>{venda.cliente_nome}</div>
            <div>{venda.cliente_telefone}</div>
            <div>{venda.cliente_endereco}</div>
          </>
        )}

        {venda.observacoes && (
          <>
            <div className="hr" />
            <div className="bold">OBS:</div>
            <div>{venda.observacoes}</div>
          </>
        )}

        <div className="hr" />
        <div className="center">Obrigado! Volte sempre 🙂</div>

        <div className="no-print" style={{ marginTop: 12 }}>
          <button
            onClick={() => window.print()}
            style={{ width: "100%", padding: 10, border: "1px solid #ddd" }}
          >
            Imprimir novamente
          </button>
        </div>
      </div>
    </div>
  );
}
