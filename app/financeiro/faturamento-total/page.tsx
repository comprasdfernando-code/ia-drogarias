"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import LineChart from "../../financeiro/ui/charts/line-chart";

type FatRow = {
  valor_liquido: number;
  competencia: string | null;
};

export default function Page() {
  const [dados, setDados] = useState<FatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from("finance_faturamento")
        .select("valor_liquido, competencia")
        .order("competencia", { ascending: true });

      if (!error && data) {
        setDados(data);
      }

      setLoading(false);
    }

    carregar();
  }, []);

  if (loading) return <p className="text-white p-4">Carregando...</p>;

  // ------------------------------
  // 🧮 CÁLCULOS
  // ------------------------------

  const total = dados.reduce((acc, item) => acc + Number(item.valor_liquido), 0);

  const mesesValidos = dados.filter((d) => d.competencia);

  const media = mesesValidos.length > 0 ? total / mesesValidos.length : 0;

  const maiorMes = mesesValidos.reduce((a, b) =>
    Number(a.valor_liquido) > Number(b.valor_liquido) ? a : b
  );

  const menorMes = mesesValidos.reduce((a, b) =>
    Number(a.valor_liquido) < Number(b.valor_liquido) ? a : b
  );

  const nomeMes = (competencia: string | null) => {
    if (!competencia) return "";
    const [, mes] = competencia.split("-");
    const nomes = [
      "jan", "fev", "mar", "abr", "mai", "jun",
      "jul", "ago", "set", "out", "nov", "dez"
    ];
    return nomes[Number(mes) - 1];
  };

  const chartData = mesesValidos.map((i) => ({
    mes: nomeMes(i.competencia),
    valor: Number(i.valor_liquido),
  }));

  const real = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-8 px-4 md:px-8 py-6">

      {/* ----------------------------------------------------- */}
      {/* TOP HEADER */}
      {/* ----------------------------------------------------- */}
      <Card className="bg-[#0D1B2A] border border-cyan-500/20 shadow-cyan-500/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-cyan-300">Faturamento Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">Visão consolidada do faturamento anual</p>
          <p className="text-slate-400 text-sm">Ano referência: 2025</p>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------- */}
      {/* KPI CARDS */}
      {/* ----------------------------------------------------- */}
      <div className="grid gap-4 md:grid-cols-4">

        <Card className="bg-[#112240] border border-cyan-500/20 shadow-cyan-500/20 shadow">
          <CardHeader>
            <CardTitle className="text-cyan-300">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-cyan-400">{real(total)}</p>
            <p className="text-xs text-emerald-400 mt-1">Dados reais (Supabase)</p>
          </CardContent>
        </Card>

        <Card className="bg-[#112240] border border-cyan-500/20 shadow-cyan-500/20 shadow">
          <CardHeader>
            <CardTitle className="text-cyan-300">Média Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-cyan-400">{real(media)}</p>
            <p className="text-xs text-slate-400 mt-1">Cálculo automático</p>
          </CardContent>
        </Card>

        <Card className="bg-[#112240] border border-cyan-500/20 shadow-cyan-500/20 shadow">
          <CardHeader>
            <CardTitle className="text-cyan-300">Maior Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-cyan-400">
              {real(Number(maiorMes.valor_liquido))}
            </p>
            <p className="text-xs text-slate-400 mt-1">{nomeMes(maiorMes.competencia)}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#112240] border border-cyan-500/20 shadow-cyan-500/20 shadow">
          <CardHeader>
            <CardTitle className="text-cyan-300">Menor Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-cyan-400">
              {real(Number(menorMes.valor_liquido))}
            </p>
            <p className="text-xs text-slate-400 mt-1">{nomeMes(menorMes.competencia)}</p>
          </CardContent>
        </Card>

      </div>

      {/* ----------------------------------------------------- */}
      {/* GRAFICO */}
      {/* ----------------------------------------------------- */}
      <Card className="bg-[#0A192F] border border-cyan-500/20 shadow-cyan-500/40 shadow-lg">
        <CardHeader>
          <CardTitle className="text-cyan-300">Evolução Mensal do Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={chartData}
            dataKey="valor"
            nameKey="mes"
          />
        </CardContent>
      </Card>

    </div>
  );
}
