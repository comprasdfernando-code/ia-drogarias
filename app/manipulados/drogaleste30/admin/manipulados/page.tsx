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
  cliente_nome: string;
  cliente_telefone: string | null;
  formula: string;
  apresentacao: string;
  valor: number | null;
  pago: boolean;
  status: string;
  solicitado_por: string | null;
  recebido_por: string | null;
  dispensado_por: string | null;
  data_solicitacao: string;
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

export default function ManipuladosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

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
    const termo = busca.trim().toLowerCase();
    if (!termo) return pedidos;

    return pedidos.filter((p) => {
      return (
        p.cliente_nome?.toLowerCase().includes(termo) ||
        p.formula?.toLowerCase().includes(termo) ||
        p.apresentacao?.toLowerCase().includes(termo) ||
        p.status?.toLowerCase().includes(termo)
      );
    });
  }, [pedidos, busca]);

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manipulados - {LOJA}</h1>
          <p className="text-sm text-gray-500">
            Controle do fluxo completo dos manipulados.
          </p>
        </div>

        <Link
          href="/manipulados/drogaleste30/admin/manipulados/novo"
          className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-white"
        >
          Novo pedido
        </Link>
      </div>

      <div className="mb-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente, fórmula, apresentação ou status"
          className="w-full rounded-xl border p-3"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border p-6">Carregando...</div>
      ) : (
        <div className="overflow-auto rounded-2xl border bg-white">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Cliente</th>
                <th className="p-3 text-left">Fórmula</th>
                <th className="p-3 text-left">Apresentação</th>
                <th className="p-3 text-left">Valor</th>
                <th className="p-3 text-left">Pago</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Solicitado por</th>
                <th className="p-3 text-left">Recebido por</th>
                <th className="p-3 text-left">Dispensado por</th>
                <th className="p-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-gray-500">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">{item.cliente_nome}</td>
                    <td className="p-3">{item.formula}</td>
                    <td className="p-3">{item.apresentacao}</td>
                    <td className="p-3">
                      R$ {Number(item.valor || 0).toFixed(2)}
                    </td>
                    <td className="p-3">{item.pago ? "Sim" : "Não"}</td>
                    <td className="p-3">{statusLabel(item.status)}</td>
                    <td className="p-3">{item.solicitado_por || "-"}</td>
                    <td className="p-3">{item.recebido_por || "-"}</td>
                    <td className="p-3">{item.dispensado_por || "-"}</td>
                    <td className="p-3">
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
    </div>
  );
}