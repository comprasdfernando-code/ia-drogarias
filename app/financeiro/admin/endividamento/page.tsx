"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function AdminEndividamento() {
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    const { data, error } = await supabase
      .from("finance_endividamento")
      .select(`
        id,
        modalidade,
        valor_total,
        saldo_devedor,
        parcela_atual,
        parcelas_total,
        juros_mensal,
        vencimento,
        finance_instituicoes ( nome )
      `)
      .order("criado_em", { ascending: false });

    if (!error && data) {
      const convert = data.map((i: any) => ({
        ...i,
        instituicao: i.finance_instituicoes?.nome ?? "—",
      }));

      setDados(convert);
    }

    setLoading(false);
  }

  async function excluir(id: string) {
    if (!confirm("Deseja realmente excluir este registro?")) return;
    await supabase.from("finance_endividamento").delete().eq("id", id);
    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  const real = (v: number) =>
    Number(v).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  if (loading) return <p className="text-white p-4">Carregando...</p>;

  return (
    <div className="px-6 py-8 space-y-8">

      {/* TOPO */}
      <div className="bg-[#112240] border border-cyan-500/20 shadow-md rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-cyan-300">
          Admin — Endividamento
        </h2>

        <p className="text-slate-400 text-sm mt-1">
          Controle de dívidas e compromissos financeiros
        </p>

        <Link
          href="/financeiro/admin/endividamento/novo"
          className="mt-4 inline-block bg-cyan-600 hover:bg-cyan-700 transition px-4 py-2 rounded text-white"
        >
          + Novo Registro
        </Link>
      </div>

      {/* TABELA */}
      <div className="bg-[#0D1B2A] border border-cyan-500/20 rounded-2xl p-6 shadow">
        <h3 className="text-lg font-medium text-cyan-300 mb-4">
          Registros de Endividamento
        </h3>

        <table className="w-full text-left text-white">
          <thead className="text-cyan-400 border-b border-cyan-500/20">
            <tr>
              <th className="py-2">Instituição</th>
              <th className="py-2">Modalidade</th>
              <th className="py-2">Saldo Atual</th>
              <th className="py-2">Parcela</th>
              <th className="py-2">Juros</th>
              <th className="py-2">Vencimento</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>

          <tbody>
            {dados.map((i) => (
              <tr key={i.id} className="border-b border-cyan-500/10">
                <td className="py-2">{i.instituicao}</td>
                <td className="py-2">{i.modalidade}</td>
                <td className="py-2">{real(i.saldo_devedor)}</td>
                <td className="py-2">
                  {i.parcela_atual}/{i.parcelas_total}
                </td>
                <td className="py-2">{i.juros_mensal}%</td>
                <td className="py-2">
                  {new Date(i.vencimento).toLocaleDateString("pt-BR")}
                </td>

                <td className="py-2 flex gap-4">
                  <Link
                    href={`/financeiro/admin/endividamento/editar/${i.id}`}
                    className="text-cyan-400 hover:text-cyan-200"
                  >
                    Editar
                  </Link>

                  <button
                    onClick={() => excluir(i.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
