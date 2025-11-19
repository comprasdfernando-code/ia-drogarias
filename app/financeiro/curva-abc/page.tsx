"use client";

import {
  FCard,
  FCardHeader,
  FCardContent,
} from "../../financeiro/ui/card";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// Dados mockados – Depois conectamos no Supabase
const distribABC = [
  { name: "Classe A", value: 70 },
  { name: "Classe B", value: 20 },
  { name: "Classe C", value: 10 },
];

const COLORS = ["#38bdf8", "#34d399", "#71717a"];

// Ranking de produtos por faturamento
const rankingProdutos = [
  { nome: "Dipirona 1L", valor: 120 },
  { nome: "Omeprazol 20mg", valor: 98 },
  { nome: "Devendol 500mg", valor: 74 },
  { nome: "Soro 500ml", valor: 53 },
  { nome: "Amoxicilina", valor: 45 },
];

export default function Page() {
  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <FCard>
        <FCardHeader
          title="Curva ABC"
          subtitle="Análise de distribuição do faturamento por categoria A/B/C"
        />
        <FCardContent>
          <div className="grid gap-4 md:grid-cols-3 text-xs md:text-sm">
            <div>
              <p className="text-slate-400">Ano referência</p>
              <p className="font-medium">2025</p>
            </div>
            <div>
              <p className="text-slate-400">Cálculo baseado em</p>
              <p className="font-medium">Faturamento total</p>
            </div>
            <div>
              <p className="text-slate-400">Atualização</p>
              <p className="font-medium text-emerald-400">Automática (Supabase)</p>
            </div>
          </div>
        </FCardContent>
      </FCard>

      {/* Cards Resumo */}
      <div className="grid gap-4 md:grid-cols-3">

        <FCard>
          <FCardHeader title="Classe A" />
          <FCardContent>
            <p className="text-2xl font-semibold text-sky-400">70%</p>
            <p className="text-xs text-slate-400 mt-1">Itens de alta relevância</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Classe B" />
          <FCardContent>
            <p className="text-2xl font-semibold text-emerald-400">20%</p>
            <p className="text-xs text-slate-400 mt-1">Relevância intermediária</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Classe C" />
          <FCardContent>
            <p className="text-2xl font-semibold text-slate-400">10%</p>
            <p className="text-xs text-slate-400 mt-1">Baixa participação</p>
          </FCardContent>
        </FCard>

      </div>

      {/* Gráfico Donut */}
      <FCard>
        <FCardHeader
          title="Distribuição Percentual"
          subtitle="Proporção entre classes A, B e C"
        />
        <FCardContent>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderColor: "#1e293b",
                    borderRadius: 12,
                  }}
                />
                <Pie
                  data={distribABC}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {distribABC.map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </FCardContent>
      </FCard>

      {/* Tabela ABC */}
      <FCard>
        <FCardHeader
          title="Tabela – Curva ABC"
          subtitle="Resumo acumulado por categoria"
        />
        <FCardContent>
          <table className="w-full text-left text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400">
                <th>Classe</th>
                <th>Participação</th>
                <th>Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Classe A", "70%", "70%"],
                ["Classe B", "20%", "90%"],
                ["Classe C", "10%", "100%"],
              ].map((item, i) => (
                <tr
                  key={i}
                  className="bg-slate-900/40 rounded-xl overflow-hidden"
                >
                  <td className="py-2 px-1">{item[0]}</td>
                  <td className="py-2 px-1 font-medium">{item[1]}</td>
                  <td className="py-2 px-1 text-emerald-400">{item[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </FCardContent>
      </FCard>

      {/* Ranking – Gráfico de Barras */}
      <FCard>
        <FCardHeader
          title="Ranking (Top 5) – Classe A"
          subtitle="Produtos com maior impacto no faturamento"
        />
        <FCardContent>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={rankingProdutos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis
                  dataKey="nome"
                  type="category"
                  width={120}
                  stroke="#9ca3af"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderColor: "#1e293b",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="valor" fill="#38bdf8" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FCardContent>
      </FCard>

    </div>
  );
}
