"use client";

import {
  FCard,
  FCardHeader,
  FCardContent,
} from "../../financeiro/ui/card";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// MOCK – depois vamos puxar do Supabase
const despesasPorCategoria = [
  { categoria: "Impostos (PIS/COFINS/ISS)", valor: 98450 },
  { categoria: "Pessoal", valor: 485341 },
  { categoria: "Despesas Gerais", valor: 107945 },
  { categoria: "CMV", valor: 310400 },
  { categoria: "Financeiras", valor: 20593 },
  { categoria: "Tributárias / Legais", valor: 18000 },
];

const detalhamento = [
  { categoria: "IPI", jan: 12000, fev: 9000, mar: 8500 },
  { categoria: "ICMS s/ Vendas", jan: 25000, fev: 24000, mar: 22000 },
  { categoria: "COFINS", jan: 18000, fev: 16500, mar: 15800 },
  { categoria: "PIS", jan: 7200, fev: 6800, mar: 6500 },
  { categoria: "ISS", jan: 11500, fev: 11200, mar: 10900 },
  { categoria: "Despesas Pessoal", jan: 357836, fev: 485341, mar: 632857 },
  { categoria: "Materiais / Consumo", jan: 22500, fev: 23900, mar: 20200 },
  { categoria: "Despesas Gerais", jan: 85099, fev: 107945, mar: 90380 },
  { categoria: "Despesas Financeiras", jan: 3425, fev: 3797, mar: 20593 },
  { categoria: "Tributos Legais", jan: 12900, fev: 14200, mar: 18000 },
];

export default function Page() {
  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <FCard>
        <FCardHeader
          title="DRE — Detalhamento"
          subtitle="Análise completa por subcategoria contábil"
        />
        <FCardContent>
          <div className="grid gap-4 md:grid-cols-3 text-xs md:text-sm">
            <div>
              <p className="text-slate-400">Ano referência</p>
              <p className="font-medium">2025</p>
            </div>
            <div>
              <p className="text-slate-400">Período</p>
              <p className="font-medium">jan — mar</p>
            </div>
            <div>
              <p className="text-slate-400">Origem dos dados</p>
              <p className="font-medium text-emerald-400">Automático — Supabase</p>
            </div>
          </div>
        </FCardContent>
      </FCard>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-4">

        <FCard>
          <FCardHeader title="Total de Impostos" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 98.450</p>
            <p className="text-xs text-slate-400 mt-1">PIS, COFINS, ISS, ICMS</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="CMV Total" />
          <FCardContent>
            <p className="text-2xl font-semibold text-red-400">R$ 310.400</p>
            <p className="text-xs text-slate-400 mt-1">Custo das Mercadorias Vendidas</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Despesas Fixas" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 485.341</p>
            <p className="text-xs text-slate-400 mt-1">Folha + Estrutura</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Despesas Variáveis" />
          <FCardContent>
            <p className="text-2xl font-semibold text-amber-300">R$ 158.000</p>
            <p className="text-xs text-slate-400 mt-1">Materiais + Gerais + Tarifas</p>
          </FCardContent>
        </FCard>

      </div>

      {/* Gráfico — Despesas por categoria */}
      <FCard>
        <FCardHeader
          title="Despesas por Categoria"
          subtitle="Distribuição total entre custos e despesas"
        />
        <FCardContent>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart
                data={despesasPorCategoria}
                layout="vertical"
                margin={{ left: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis type="category" dataKey="categoria" stroke="#9ca3af" />
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

      {/* Tabela detalhada */}
      <FCard>
        <FCardHeader
          title="Tabela Detalhada"
          subtitle="Detalhamento completo por subcategoria"
        />
        <FCardContent>
          <table className="w-full text-left text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400">
                <th>Categoria</th>
                <th>Jan</th>
                <th>Fev</th>
                <th>Mar</th>
              </tr>
            </thead>
            <tbody>
              {detalhamento.map((row, i) => (
                <tr key={i} className="bg-slate-900/40 rounded-xl overflow-hidden">
                  <td className="py-2 px-2">{row.categoria}</td>
                  <td className="py-2 px-2">{row.jan.toLocaleString()}</td>
                  <td className="py-2 px-2">{row.fev.toLocaleString()}</td>
                  <td className="py-2 px-2">{row.mar.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </FCardContent>
      </FCard>

    </div>
  );
}
