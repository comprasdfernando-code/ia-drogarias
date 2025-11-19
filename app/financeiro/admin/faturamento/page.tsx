"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";

type Faturamento = {
  id: string;
  competencia: string | null;
  valor_liquido: number;
  numero_nf: string | null;
  data_emissao: string | null;
};

export default function AdminFaturamento() {
  const [dados, setDados] = useState<Faturamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("finance_faturamento")
        .select("id, competencia, valor_liquido, numero_nf, data_emissao")
        .order("competencia", { ascending: true });

      setDados(data || []);
      setLoading(false);
    }

    load();
  }, []);

  const real = (v: number) =>
    v?.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <div className="px-4 md:px-10 py-8 space-y-8">

      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle>Admin — Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">
            Cadastro, edição e gerenciamento do faturamento mensal.
          </p>

          <Link href="/financeiro/admin/faturamento/novo">
            <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              + Novo Lançamento
            </button>
          </Link>
        </CardContent>
      </Card>

      {/* Tabela de Lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-300">Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-zinc-900 text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 text-left">
                    <th className="p-3">Competência</th>
                    <th className="p-3">Data Emissão</th>
                    <th className="p-3">NF</th>
                    <th className="p-3">Valor Líquido</th>
                    <th className="p-3">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {dados.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-zinc-700 hover:bg-zinc-800"
                    >
                      <td className="p-3">{row.competencia}</td>
                      <td className="p-3">{row.data_emissao}</td>
                      <td className="p-3">{row.numero_nf}</td>
                      <td className="p-3 font-semibold">
                        {real(Number(row.valor_liquido))}
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/financeiro/admin/faturamento/editar/${row.id}`}
                          className="text-blue-400 hover:underline mr-3"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/financeiro/admin/faturamento/excluir/${row.id}`}
                          className="text-red-400 hover:underline"
                        >
                          Excluir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {dados.length === 0 && (
                <p className="text-slate-400 mt-4">Nenhum lançamento registrado.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
