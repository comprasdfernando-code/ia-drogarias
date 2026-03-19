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
  loja: string;
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
  solicitado_por: string | null;
  data_solicitacao: string | null;
};

function tipoRecebimentoLabel(tipo?: string | null) {
  switch (tipo) {
    case "entrega":
      return "Entrega";
    case "retirada":
      return "Retirada na loja";
    default:
      return "-";
  }
}

function formatarData(data?: string | null) {
  if (!data) return "-";

  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return data;

  return dt.toLocaleString("pt-BR");
}

export default function NotaEntregaPage() {
  const params = useParams();
  const id = params?.id as string;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  async function carregarPedido() {
    setLoading(true);

    const { data, error } = await supabase
      .from("manipulados_pedidos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      alert("Erro ao carregar nota.");
    } else {
      setPedido(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (id) carregarPedido();
  }, [id]);

  const dataEmissao = useMemo(() => {
    return new Date().toLocaleString("pt-BR");
  }, []);

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!pedido) {
    return <div className="p-6">Pedido não encontrado.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-6 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Nota de entrega</h1>
          <p className="text-sm text-gray-500">{LOJA}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white"
          >
            Imprimir / Salvar PDF
          </button>

          <Link
            href={`/manipulados/drogaleste30/admin/manipulados/${pedido.id}`}
            className="rounded-xl border px-4 py-2"
          >
            Voltar ao pedido
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-8 text-black print:rounded-none print:border-0 print:p-0">
        <div className="mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold tracking-wide">{LOJA}</h1>
          <h2 className="mt-1 text-lg font-semibold">
            NOTA SIMPLES DE ENTREGA / RETIRADA
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Emitido em: {dataEmissao}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <h3 className="mb-2 text-base font-semibold">Dados do cliente</h3>
            <p><strong>REQ:</strong> {pedido.req || "-"}</p>
            <p><strong>Cliente:</strong> {pedido.cliente_nome}</p>
            <p><strong>Telefone:</strong> {pedido.cliente_telefone || "-"}</p>
            <p><strong>Forma de recebimento:</strong> {tipoRecebimentoLabel(pedido.tipo_recebimento)}</p>
            <p><strong>Endereço:</strong> {pedido.cliente_endereco || "-"}</p>
          </div>

          <div className="space-y-2 text-sm">
            <h3 className="mb-2 text-base font-semibold">Dados da fórmula</h3>
            <p><strong>Fórmula:</strong> {pedido.formula}</p>
            <p><strong>Apresentação:</strong> {pedido.apresentacao}</p>
            <p><strong>Valor:</strong> R$ {Number(pedido.valor || 0).toFixed(2)}</p>
            <p><strong>Pago:</strong> {pedido.pago ? "Sim" : "Não"}</p>
            <p><strong>Solicitado por:</strong> {pedido.solicitado_por || "-"}</p>
            <p><strong>Data da solicitação:</strong> {formatarData(pedido.data_solicitacao)}</p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-2 text-base font-semibold">Observações</h3>
          <div className="min-h-[100px] rounded-xl border p-4 text-sm">
            {pedido.observacoes || "Sem observações."}
          </div>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <div>
            <div className="mb-2 text-sm font-medium">Assinatura do responsável pela entrega</div>
            <div className="h-16 border-b" />
          </div>

          <div>
            <div className="mb-2 text-sm font-medium">Assinatura do cliente / recebedor</div>
            <div className="h-16 border-b" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @page {
          size: A4;
          margin: 12mm;
        }

        @media print {
          html,
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}