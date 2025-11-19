"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import LineChart from "../ui/charts/line-chart";

export default function FaturamentoTotal() {
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from("finance_faturamento")
        .select("*")
        .order("competencia", { ascending: true });

      if (!error && data) {
        setDados(data);
      }
      setLoading(false);
    }

    carregar();
  }, []);

  // Função formatadora
  const real = (v: number | null | undefined) =>
    v ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

  // Se não tiver dados ainda
  if (loading) return <div className="text-center text-white">Carregando...</div>;

  // Cálculos automáticos
  const total = dados.reduce((s, r) => s + Number(r.valor_liquido || 0), 0);
  const mediaMensal = total / (dados.length || 1);

  const maior = Math.max(...dados.map((d) => Number(d.valor_liquido)), 0);
  const menor = Math.min(...dados.map((d) => Number(d.valor_liquido)), 0);

  const mesMaior = dados.find((d) => d.valor_liquido == maior)?.competencia || "—";
  const mesMenor = dados.find((d) => d.valor_liquido == menor)?.competencia || "—";

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Painel Financeiro</h1>

      {/* Card Principal */}
      <div className="bg-[#0F172A] border border-white/10 p-6 rounded-2xl shadow-lg shadow-blue-500/5 mb-6">
        <h2 className="text-lg text-gray-300">Faturamento Total</h2>
        <p className="text-sm text-green-400">Dados reais (Supabase)</p>
        <p className="text-4xl font-semibold text-blue-400 mt-3">
          {real(total)}
        </p>
      </div>

      {/* Cards Secundários */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111827] p-5 rounded-xl shadow-md shadow-blue-500/10">
          <h3 className="text-sm text-gray-400">Média Mensal</h3>
          <p className="text-3xl font-semibold text-green-400">{real(mediaMensal)}</p>
        </div>

        <div className="bg-[#111827] p-5 rounded-xl shadow-md shadow-yellow-500/10">
          <h3 className="text-sm text-gray-400">Maior Faturamento</h3>
          <p className="text-3xl font-semibold text-yellow-400">{real(maior)}</p>
          <span className="text-xs text-gray-400">{mesMaior}</span>
        </div>

        <div className="bg-[#111827] p-5 rounded-xl shadow-md shadow-red-500/10">
          <h3 className="text-sm text-gray-400">Menor Faturamento</h3>
          <p className="text-3xl font-semibold text-red-400">{real(menor)}</p>
          <span className="text-xs text-gray-400">{mesMenor}</span>
        </div>

        <div className="bg-[#111827] p-5 rounded-xl shadow-md shadow-cyan-500/10">
          <h3 className="text-sm text-gray-400">Lançamentos</h3>
          <p className="text-3xl font-semibold text-cyan-400">{dados.length}</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-[#0F172A] border border-white/10 p-6 rounded-2xl shadow-lg shadow-blue-500/5">
        <h3 className="text-gray-300 mb-4">Evolução Mensal do Faturamento</h3>

        <LineChart
  data={dados}
  nameKey="competencia"
  dataKey="valor_liquido"
/>

      </div>
    </div>
  );
}
