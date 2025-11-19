"use client";

import {
  FCard,
  FCardHeader,
  FCardContent,
} from "../../financeiro/ui/card";

import GaugeRisk from "../../financeiro/charts/gauge-risk";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// MOCK — depois vira consulta ao Supabase
const riscoInstituicoes = [
  { inst: "C6 Bank", risco: 72 },
  { inst: "Mercado Pago", risco: 65 },
  { inst: "Stone", risco: 40 },
  { inst: "Sicoob", risco: 85 },
  { inst: "BV Financeira", risco: 58 },
];

export default function Page() {
  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <FCard>
        <FCardHeader
          title="Risco Total"
          subtitle="Análise consolidada do risco financeiro do grupo IA Drogarias"
        />
        <FCardContent>
          <div className="grid gap-4 md:grid-cols-3 text-xs md:text-sm">
            <div>
              <p className="text-slate-400">Ano referência</p>
              <p className="font-medium">2025</p>
            </div>
            <div>
              <p className="text-slate-400">Instituições ativas</p>
              <p className="font-medium">5 bancos</p>
            </div>
            <div>
              <p className="text-slate-400">Status</p>
              <p className="font-medium text-emerald-400">Monitoramento ativo</p>
            </div>
          </div>
        </FCardContent>
      </FCard>

      {/* Gauge + Cards */}
      <div className="grid gap-4 md:grid-cols-3">

        <FCard>
  <div className="flex items-center justify-center">
    <FCardHeader title="Score Geral de Risco" />
    <FCardContent>
      <GaugeRisk value={68} />
    </FCardContent>
  </div>
</FCard>


        <FCard>
          <FCardHeader title="Alerta Máximo" />
          <FCardContent>
            <p className="text-2xl font-semibold text-red-400">Sicoob</p>
            <p className="text-xs text-slate-400 mt-1">
              Índice de risco acima do limite aceitável.
            </p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Instituições em Observação" />
          <FCardContent>
            <p className="text-2xl font-semibold text-amber-300">3</p>
            <p className="text-xs text-slate-400 mt-1">
              C6 Bank, Mercado Pago, BV
            </p>
          </FCardContent>
        </FCard>

      </div>

      {/* Gráfico de Barras */}
      <FCard>
        <FCardHeader
          title="Risco por Instituição"
          subtitle="Avaliação individual de cada parceiro financeiro"
        />
        <FCardContent>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart
                layout="vertical"
                data={riscoInstituicoes}
                margin={{ left: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="inst" type="category" stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderColor: "#1e293b",
                    borderRadius: 12,
                  }}
                />
                <Bar
                  dataKey="risco"
                  radius={[0, 6, 6, 0]}
                  fill="#ef4444"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FCardContent>
      </FCard>

      {/* Tabela */}
      <FCard>
        <FCardHeader
          title="Detalhamento de Risco"
          subtitle="Índice de risco individual por instituição"
        />
        <FCardContent>
          <table className="w-full text-left text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400">
                <th>Instituição</th>
                <th>Índice (%)</th>
                <th>Nível</th>
              </tr>
            </thead>
            <tbody>
              {riscoInstituicoes.map((item, i) => (
                <tr
                  key={i}
                  className="bg-slate-900/40 rounded-xl overflow-hidden"
                >
                  <td className="py-2 px-1">{item.inst}</td>
                  <td className="py-2 px-1 font-medium">{item.risco}%</td>
                  <td
                    className={`py-2 px-1 ${
                      item.risco >= 75
                        ? "text-red-400"
                        : item.risco >= 50
                        ? "text-amber-300"
                        : "text-emerald-400"
                    }`}
                  >
                    {item.risco >= 75
                      ? "Alta"
                      : item.risco >= 50
                      ? "Média"
                      : "Baixa"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </FCardContent>
      </FCard>

    </div>
  );
}
