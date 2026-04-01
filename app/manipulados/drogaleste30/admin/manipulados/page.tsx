"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Pedido = {
  id: string;
  loja: string;
  req: string | null;
  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_endereco: string | null;
  formula: string;
  apresentacao: string;
  valor: number | null;
  pago: boolean;
  status: string;
  solicitado_por: string | null;
  recebido_por: string | null;
  dispensado_por: string | null;
  comprovante_url: string | null;
  data_solicitacao: string | null;
};

const LOJA = "Droga Leste 30";

function statusLabel(status: string) {
  switch (status) {
    case "solicitado_manipulacao":
      return "Solicitado";
    case "em_producao":
      return "Em produção";
    case "chegou_loja":
      return "Chegou na loja";
    case "disponivel_retirada":
      return "Disponível";
    case "retirado":
      return "Retirado";
    case "cancelado":
      return "Cancelado";
    default:
      return status;
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "solicitado_manipulacao":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "em_producao":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "chegou_loja":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "disponivel_retirada":
      return "bg-green-100 text-green-800 border-green-200";
    case "retirado":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "cancelado":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export default function ManipuladosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPago, setFiltroPago] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  async function carregarPedidos() {
    setLoading(true);

    const { data, error } = await supabase
      .from("manipulados_pedidos")
      .select("*")
      .eq("loja", LOJA)
      .order("data_solicitacao", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar pedidos.");
    } else {
      setPedidos(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    carregarPedidos();
  }, []);

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      const termo = busca.trim().toLowerCase();

      const bateBusca =
        !termo ||
        (p.req || "").toLowerCase().includes(termo) ||
        (p.cliente_nome || "").toLowerCase().includes(termo) ||
        (p.cliente_telefone || "").toLowerCase().includes(termo) ||
        (p.cliente_endereco || "").toLowerCase().includes(termo) ||
        (p.formula || "").toLowerCase().includes(termo) ||
        (p.apresentacao || "").toLowerCase().includes(termo) ||
        (p.status || "").toLowerCase().includes(termo);

      const bateStatus = !filtroStatus || p.status === filtroStatus;

      const batePago =
        !filtroPago ||
        (filtroPago === "sim" && p.pago) ||
        (filtroPago === "nao" && !p.pago);

      const dataPedido = p.data_solicitacao?.slice(0, 10) || "";
      const bateInicio = !dataInicio || dataPedido >= dataInicio;
      const bateFim = !dataFim || dataPedido <= dataFim;

      return bateBusca && bateStatus && batePago && bateInicio && bateFim;
    });
  }, [pedidos, busca, filtroStatus, filtroPago, dataInicio, dataFim]);

  const relatorio = useMemo(() => {
    const total = pedidosFiltrados.length;
    const totalPago = pedidosFiltrados.filter((p) => p.pago).length;
    const totalNaoPago = pedidosFiltrados.filter((p) => !p.pago).length;
    const totalDisponivel = pedidosFiltrados.filter(
      (p) => p.status === "disponivel_retirada"
    ).length;
    const totalRetirado = pedidosFiltrados.filter(
      (p) => p.status === "retirado"
    ).length;
    const totalComprovante = pedidosFiltrados.filter(
      (p) => !!p.comprovante_url
    ).length;

    const valorTotal = pedidosFiltrados.reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0
    );

    return {
      total,
      totalPago,
      totalNaoPago,
      totalDisponivel,
      totalRetirado,
      totalComprovante,
      valorTotal,
    };
  }, [pedidosFiltrados]);

  const dataEmissao = useMemo(() => {
    return new Date().toLocaleString("pt-BR");
  }, []);

  function limparFiltros() {
    setBusca("");
    setFiltroStatus("");
    setFiltroPago("");
    setDataInicio("");
    setDataFim("");
  }

  function gerarPDF() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 print:p-0">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print:hidden md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Módulo de Manipulados
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Manipulados - {LOJA}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Controle do fluxo completo dos manipulados
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/manipulados/formulas"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Fórmulas
              </Link>

              <button
                onClick={gerarPDF}
                className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
              >
                Gerar PDF
              </button>

              <Link
                href="/manipulados/drogaleste30/admin/manipulados/novo"
                className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700"
              >
                Novo pedido
              </Link>
            </div>
          </div>
        </div>

        <div className="print-report-header hidden print:block">
          <div className="print-report-title">Relatório de Manipulados</div>
          <div className="print-report-subtitle">{LOJA}</div>
          <div className="print-report-meta">Emitido em: {dataEmissao}</div>
          <div className="print-report-meta">
            Filtros aplicados: Status:{" "}
            {filtroStatus ? statusLabel(filtroStatus) : "Todos"} | Pagamento:{" "}
            {filtroPago === "sim"
              ? "Somente pagos"
              : filtroPago === "nao"
              ? "Somente não pagos"
              : "Todos"}{" "}
            | Período: {dataInicio || "Início"} até {dataFim || "Hoje"}
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6 print:grid-cols-3 print:gap-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm print:rounded-lg print:p-3">
            <p className="text-sm text-slate-500 print:text-[11px]">Total</p>
            <p className="text-2xl font-bold text-slate-900 print:text-lg">
              {relatorio.total}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm print:rounded-lg print:p-3">
            <p className="text-sm text-slate-500 print:text-[11px]">Pagos</p>
            <p className="text-2xl font-bold text-slate-900 print:text-lg">
              {relatorio.totalPago}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm print:rounded-lg print:p-3">
            <p className="text-sm text-slate-500 print:text-[11px]">
              Não pagos
            </p>
            <p className="text-2xl font-bold text-slate-900 print:text-lg">
              {relatorio.totalNaoPago}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm print:rounded-lg print:p-3">
            <p className="text-sm text-slate-500 print:text-[11px]">
              Disponíveis
            </p>
            <p className="text-2xl font-bold text-slate-900 print:text-lg">
              {relatorio.totalDisponivel}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm print:rounded-lg print:p-3">
            <p className="text-sm text-slate-500 print:text-[11px]">
              Retirados
            </p>
            <p className="text-2xl font-bold text-slate-900 print:text-lg">
              {relatorio.totalRetirado}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm print:rounded-lg print:p-3">
            <p className="text-sm text-slate-500 print:text-[11px]">
              Com comprovante
            </p>
            <p className="text-2xl font-bold text-slate-900 print:text-lg">
              {relatorio.totalComprovante}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white shadow-sm md:col-span-3 xl:col-span-6 print:col-span-3 print:rounded-lg print:border print:border-slate-300 print:bg-white print:p-3 print:text-black">
            <p className="text-sm text-slate-300 print:text-[11px] print:text-gray-500">
              Valor total filtrado
            </p>
            <p className="text-2xl font-bold print:text-lg">
              R$ {relatorio.valorTotal.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm print:hidden md:p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Filtros</h2>
            <p className="text-sm text-slate-500">
              Refine a visualização dos pedidos
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por REQ, cliente, telefone, fórmula..."
              className="w-full rounded-2xl border border-slate-300 p-3 outline-none transition focus:border-slate-500"
            />

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 p-3 outline-none transition focus:border-slate-500"
            >
              <option value="">Todos os status</option>
              <option value="solicitado_manipulacao">Solicitado</option>
              <option value="em_producao">Em produção</option>
              <option value="chegou_loja">Chegou na loja</option>
              <option value="disponivel_retirada">Disponível</option>
              <option value="retirado">Retirado</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <select
              value={filtroPago}
              onChange={(e) => setFiltroPago(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 p-3 outline-none transition focus:border-slate-500"
            >
              <option value="">Pago e não pago</option>
              <option value="sim">Somente pagos</option>
              <option value="nao">Somente não pagos</option>
            </select>

            <button
              onClick={limparFiltros}
              className="rounded-2xl border border-slate-300 bg-white p-3 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Limpar filtros
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 p-3 outline-none transition focus:border-slate-500"
            />

            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 p-3 outline-none transition focus:border-slate-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Carregando...
          </div>
        ) : (
          <div className="overflow-auto rounded-3xl border border-slate-200 bg-white shadow-sm print:overflow-visible print:rounded-none print:border print:border-gray-300">
            <table className="w-full min-w-[1250px] text-sm print:min-w-0 print:text-[10px]">
              <thead className="bg-slate-50 print:bg-gray-200">
                <tr>
                  <th className="p-4 text-left font-semibold text-slate-700 print:px-2 print:py-2">
                    REQ
                  </th>
                  <th className="p-4 text-left font-semibold text-slate-700 print:px-2 print:py-2">
                    Cliente
                  </th>
                  <th className="p-4 text-left font-semibold text-slate-700 print:px-2 print:py-2">
                    Telefone
                  </th>
                  <th className="p-4 text-left font-semibold text-slate-700 print:px-2 print:py-2">
                    Fórmula
                  </th>
                  <th className="p-4 text-left font-semibold text-slate-700 print:px-2 print:py-2">
                    Apresentação
                  </th>
                  <th className="p-4 text-left font-semibold text-slate-700 print:px-2 print:py-2">
                    Valor
                  </th>
                  <th className="p-4 text-left font-semibold text-slate-700 print:px-2 print:py-2">
                    Pago
                  </th>
                  <th className="p-4 text-left font-semibold text-slate-700 print:px-2 print:py-2">
                    Status
                  </th>
                  <th className="p-4 text-left font-semibold text-slate-700 print:px-2 print:py-2">
                    Solicitado por
                  </th>
                  <th className="p-4 text-left font-semibold text-slate-700 print:px-2 print:py-2">
                    Comprovante
                  </th>
                  <th className="p-4 text-left font-semibold text-slate-700 print:hidden">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="p-8 text-center text-slate-500"
                    >
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                ) : (
                  pedidosFiltrados.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70 print:break-inside-avoid"
                    >
                      <td className="p-4 align-top text-slate-700 print:px-2 print:py-2">
                        {item.req || "-"}
                      </td>
                      <td className="p-4 align-top font-medium text-slate-900 print:px-2 print:py-2">
                        {item.cliente_nome}
                      </td>
                      <td className="p-4 align-top text-slate-700 print:px-2 print:py-2">
                        {item.cliente_telefone || "-"}
                      </td>
                      <td className="p-4 align-top text-slate-700 print:px-2 print:py-2">
                        {item.formula}
                      </td>
                      <td className="p-4 align-top text-slate-700 print:px-2 print:py-2">
                        {item.apresentacao}
                      </td>
                      <td className="whitespace-nowrap p-4 align-top text-slate-700 print:px-2 print:py-2">
                        R$ {Number(item.valor || 0).toFixed(2)}
                      </td>
                      <td className="p-4 align-top text-slate-700 print:px-2 print:py-2">
                        {item.pago ? "Sim" : "Não"}
                      </td>
                      <td className="p-4 align-top print:px-2 print:py-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium print:rounded-none print:border-0 print:px-0 print:py-0 print:text-[10px] ${statusBadgeClass(
                            item.status
                          )}`}
                        >
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td className="p-4 align-top text-slate-700 print:px-2 print:py-2">
                        {item.solicitado_por || "-"}
                      </td>
                      <td className="p-4 align-top text-slate-700 print:px-2 print:py-2">
                        {item.comprovante_url ? "Sim" : "Não"}
                      </td>
                      <td className="p-4 print:hidden">
                        <Link
                          href={`/manipulados/drogaleste30/admin/manipulados/${item.id}`}
                          className="inline-flex rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 10mm;
        }

        @media print {
          html,
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            font-size: 11px;
            color: #000;
          }

          a {
            text-decoration: none !important;
            color: inherit !important;
          }

          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }

          thead {
            display: table-header-group;
          }

          tr,
          td,
          th {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-report-header {
            margin-bottom: 10px;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 8px;
          }

          .print-report-title {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
          }

          .print-report-subtitle {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            margin-top: 2px;
          }

          .print-report-meta {
            font-size: 10px;
            color: #4b5563;
            margin-top: 2px;
          }
        }
      `}</style>
    </div>
  );
}