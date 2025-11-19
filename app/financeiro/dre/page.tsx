"use client";

import {
  FCard,
  FCardHeader,
  FCardContent,
} from "../../financeiro/ui/card";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// MOCK — depois será alimentado pelo Supabase
const dreMensal = [
  { mes: "jan", receita: 980000, lucro: 112000 },
  { mes: "fev", receita: 865000, lucro: 94000 },
  { mes: "mar", receita: 903000, lucro: 108500 },
  { mes: "abr", receita: 884000, lucro: 102900 },
  { mes: "mai", receita: 912000, lucro: 113200 },
];

const dreTabela = [
  { categoria: "01 - RECEITA BRUTA", jan: 1102858, fev: 636532, mar: 624812 },
  { categoria: "02 - DEDUÇÕES", jan: -67747, fev: -38415, mar: -73169 },
  { categoria: "03 - RECEITA LÍQUIDA", jan: 1035111, fev: 598146, mar: 567297 },
  { categoria: "04 - CMV", jan: -445000, fev: -282000, mar: -310400 },
  { categoria: "05 - MARGEM BRUTA", jan: 589111, fev: 316146, mar: 256897 },

  { categoria: "06 - DESPESAS OPERACIONAIS", jan: -442935, fev: -593285, mar: -523523 },
  { categoria: "07 - DESPESAS PESSOAL", jan: -357836, fev: -485341, mar: -632857 },
  { categoria: "08 - DESPESAS GERAIS", jan: -85099, fev: -107945, mar: -90380 },

  { categoria: "09 - RESULTADO OPERACIONAL", jan: 592177, fev: 4861, mar: 43773 },
  { categoria: "10 - DESPESAS FINANCEIRAS", jan: -3425, fev: -3797, mar: -20593 },
  { categoria: "11 - EBITDA", jan: 588752, fev: 1103, mar: 40712 },

  { categoria: "12 - EBIT", jan: 588752, fev: 1103, mar: 63056 },
  { categoria: "13 - RESULTADO LÍQUIDO", jan: 559119, fev: -17364, mar: -564934 },
  { categoria: "16 - RESULTADO FINAL", jan: 481143, fev: -174609, mar: -201402 },
];

export default function Page() {
  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <FCard>
        <FCardHeader
          title="DRE — Demonstrativo de Resultado"
          subtitle="Visão consolidada do desempenho operacional e financeiro"
        />
        <FCardContent>
          <div className="grid gap-4 md:grid-cols-3 text-xs md:text-sm">
            <div>
              <p className="text-slate-400">Ano referência</p>
              <p className="font-medium">2025</p>
            </div>
            <div>
              <p className="text-slate-400">Período analisado</p>
              <p className="font-medium">jan — mai</p>
            </div>
            <div>
              <p className="text-slate-400">Status</p>
              <p className="font-medium text-emerald-400">Análise atualizada</p>
            </div>
          </div>
        </FCardContent>
      </FCard>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-4">

        <FCard>
          <FCardHeader title="Receita Líquida Média" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 733.518</p>
            <p className="text-xs text-slate-400 mt-1">Média trimestral</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Margem Bruta" />
          <FCardContent>
            <p className="text-2xl font-semibold">33,8%</p>
            <p className="text-xs text-slate-400 mt-1">Após CMV</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="EBITDA Médio" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 210.189</p>
            <p className="text-xs text-slate-400 mt-1">Resultado operacional</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Lucro Líquido" />
          <FCardContent>
            <p className="text-2xl font-semibold text-emerald-400">R$ 165.300</p>
            <p className="text-xs text-slate-400 mt-1">Após impostos</p>
          </FCardContent>
        </FCard>

      </div>

      {/* Gráfico Evolução */}
      <FCard>
        <FCardHeader
          title="Evolução — Receita x Lucro"
          subtitle="Tendência dos últimos meses"
        />
        <FCardContent>
          <div className="h-80">
            <ResponsiveContainer>
              <LineChart data={dreMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="mes" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderColor: "#1e293b",
                    borderRadius: 12,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="receita"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  name="Receita"
                />
                <Line
                  type="monotone"
                  dataKey="lucro"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Lucro"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </FCardContent>
      </FCard>

      {/* Tabela DRE */}
      <FCard>
        <FCardHeader
          title="DRE — Tabela Detalhada"
          subtitle="Análise estrutural por categoria contábil"
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
              {dreTabela.map((row, i) => (
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
