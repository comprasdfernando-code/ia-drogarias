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
      return "bg-yellow-100 text-yellow-800";
    case "em_producao":
      return "bg-orange-100 text-orange-800";
    case "chegou_loja":
      return "bg-blue-100 text-blue-800";
    case "disponivel_retirada":
      return "bg-green-100 text-green-800";
    case "retirado":
      return "bg-purple-100 text-purple-800";
    case "cancelado":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
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
    <div className="p-6 print:p-0">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Manipulados - {LOJA}</h1>
          <p className="text-sm text-gray-500">
            Controle do fluxo completo dos manipulados
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={gerarPDF}
            className="rounded-xl bg-red-600 px-4 py-2 text-white"
          >
            Gerar PDF
          </button>

          <Link
            href="/manipulados/drogaleste30/admin/manipulados/novo"
            className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-white"
          >
            Novo pedido
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{relatorio.total}</p>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">Pagos</p>
          <p className="text-2xl font-bold">{relatorio.totalPago}</p>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">Não pagos</p>
          <p className="text-2xl font-bold">{relatorio.totalNaoPago}</p>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">Disponíveis</p>
          <p className="text-2xl font-bold">{relatorio.totalDisponivel}</p>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">Retirados</p>
          <p className="text-2xl font-bold">{relatorio.totalRetirado}</p>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500">Com comprovante</p>
          <p className="text-2xl font-bold">{relatorio.totalComprovante}</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 md:col-span-3 xl:col-span-6">
          <p className="text-sm text-gray-500">Valor total filtrado</p>
          <p className="text-2xl font-bold">
            R$ {relatorio.valorTotal.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-4 print:hidden">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por REQ, cliente, telefone, fórmula..."
          className="w-full rounded-xl border p-3"
        />

        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="w-full rounded-xl border p-3"
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
          className="w-full rounded-xl border p-3"
        >
          <option value="">Pago e não pago</option>
          <option value="sim">Somente pagos</option>
          <option value="nao">Somente não pagos</option>
        </select>

        <button onClick={limparFiltros} className="rounded-xl border p-3">
          Limpar filtros
        </button>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 print:hidden">
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="w-full rounded-xl border p-3"
        />

        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          className="w-full rounded-xl border p-3"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border p-6">Carregando...</div>
      ) : (
        <div className="overflow-auto rounded-2xl border bg-white">
          <table className="w-full min-w-[1250px] text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">REQ</th>
                <th className="p-3 text-left">Cliente</th>
                <th className="p-3 text-left">Telefone</th>
                <th className="p-3 text-left">Fórmula</th>
                <th className="p-3 text-left">Apresentação</th>
                <th className="p-3 text-left">Valor</th>
                <th className="p-3 text-left">Pago</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Solicitado por</th>
                <th className="p-3 text-left">Comprovante</th>
                <th className="p-3 text-left print:hidden">Ações</th>
              </tr>
            </thead>

            <tbody>
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-6 text-center text-gray-500">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">{item.req || "-"}</td>
                    <td className="p-3">{item.cliente_nome}</td>
                    <td className="p-3">{item.cliente_telefone || "-"}</td>
                    <td className="p-3">{item.formula}</td>
                    <td className="p-3">{item.apresentacao}</td>
                    <td className="p-3">
                      R$ {Number(item.valor || 0).toFixed(2)}
                    </td>
                    <td className="p-3">{item.pago ? "Sim" : "Não"}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(
                          item.status
                        )}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="p-3">{item.solicitado_por || "-"}</td>
                    <td className="p-3">
                      {item.comprovante_url ? "Sim" : "Não"}
                    </td>
                    <td className="p-3 print:hidden">
                      <Link
                        href={`/manipulados/drogaleste30/admin/manipulados/${item.id}`}
                        className="text-blue-600 hover:underline"
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

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          a {
            text-decoration: none !important;
            color: inherit !important;
          }
        }
      `}</style>
    </div>
  );
}