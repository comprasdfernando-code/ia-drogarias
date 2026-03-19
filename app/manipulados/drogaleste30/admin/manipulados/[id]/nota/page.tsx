"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LOJA = "Droga Leste 30";

type Pedido = {
  id: string;
  req: string | null;
  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_endereco: string | null;
  tipo_recebimento: string | null;
  formula: string;
  apresentacao: string;
  observacoes: string | null;
  valor: number | null;
  pago: boolean;
  data_solicitacao: string | null;
};

function tipoRecebimentoLabel(tipo?: string | null) {
  if (tipo === "entrega") return "Entrega";
  if (tipo === "retirada") return "Retirada na loja";
  return "-";
}

function formatarData(data?: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR");
}

export default function NotaEntregaPage() {
  const params = useParams();
  const id = params?.id as string;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from("manipulados_pedidos")
        .select("*")
        .eq("id", id)
        .single();

      if (data) setPedido(data);
      setLoading(false);
    }

    if (id) carregar();
  }, [id]);

  const dataAgora = useMemo(() => {
    return new Date().toLocaleString("pt-BR");
  }, []);

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!pedido) return <div className="p-6">Pedido não encontrado.</div>;

  return (
    <div className="mx-auto max-w-md p-4 print:p-0">
      
      {/* BOTÕES */}
      <div className="mb-4 flex justify-between print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-blue-600 px-3 py-2 text-white"
        >
          Imprimir / PDF
        </button>

        <Link
          href={`/manipulados/drogaleste30/admin/manipulados/${pedido.id}`}
          className="rounded-lg border px-3 py-2"
        >
          Voltar
        </Link>
      </div>

      {/* NOTA */}
      <div className="rounded-xl border bg-white p-5 text-black text-sm">

        {/* HEADER */}
        <div className="mb-4 text-center">
          <h1 className="text-lg font-bold">{LOJA}</h1>
          <p className="text-xs text-gray-500">
            NOTA DE ENTREGA DE MANIPULADO
          </p>
        </div>

        <hr className="my-3" />

        {/* PEDIDO */}
        <div className="space-y-1">
          <p><strong>REQ:</strong> {pedido.req || "-"}</p>
          <p><strong>Data:</strong> {formatarData(pedido.data_solicitacao)}</p>
          <p><strong>Emissão:</strong> {dataAgora}</p>
        </div>

        <hr className="my-3" />

        {/* CLIENTE */}
        <div className="space-y-1">
          <p className="font-semibold">Cliente</p>
          <p>{pedido.cliente_nome}</p>
          <p>{pedido.cliente_telefone || "-"}</p>
        </div>

        <hr className="my-3" />

        {/* ENTREGA */}
        <div className="space-y-1">
          <p className="font-semibold">Recebimento</p>
          <p>{tipoRecebimentoLabel(pedido.tipo_recebimento)}</p>
          <p>{pedido.cliente_endereco || "-"}</p>
        </div>

        <hr className="my-3" />

        {/* PRODUTO */}
        <div className="space-y-1">
          <p className="font-semibold">Pedido</p>
          <p>1x {pedido.formula}</p>
          <p className="text-gray-600">
            Apresentação: {pedido.apresentacao}
          </p>
        </div>

        <hr className="my-3" />

        {/* PAGAMENTO */}
        <div className="space-y-1">
          <p className="font-semibold">Pagamento</p>
          <p>Valor: R$ {Number(pedido.valor || 0).toFixed(2)}</p>
          <p>
            Status:{" "}
            <span className={pedido.pago ? "text-green-600" : "text-red-600"}>
              {pedido.pago ? "Pago" : "Pendente"}
            </span>
          </p>
        </div>

        <hr className="my-3" />

        {/* OBS */}
        <div className="space-y-1">
          <p className="font-semibold">Observações</p>
          <p>{pedido.observacoes || "Sem observações"}</p>
        </div>

        <hr className="my-4" />

        {/* ASSINATURA */}
        <div className="mt-6 space-y-6">
          <div>
            <p className="text-xs text-gray-500">Responsável pela entrega</p>
            <div className="h-10 border-b" />
          </div>

          <div>
            <p className="text-xs text-gray-500">Cliente / Recebedor</p>
            <div className="h-10 border-b" />
          </div>
        </div>

      </div>

      {/* PRINT */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}