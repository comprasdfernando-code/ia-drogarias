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

// MOCK – depois será integrável ao Supabase
const equilibrioGraph = [
  { nome: "Receita Média", valor: 262689 },
  { nome: "Despesas Fixas", valor: 217101 },
  { nome: "Despesas Variáveis", valor: 28600 },
  { nome: "Ponto de Equilíbrio", valor: 243594 },
];

const tabela = [
  { categoria: "Receita Bruta Média", valor: 262689, variavel: "0%" },
  { categoria: "Despesas Fixas", valor: 217101, variavel: "100%" },
  { categoria: "Despesas Variáveis", valor: 28600, variavel: "10,88%" },
  { categoria: "Margem de Contribuição", valor: 45488, variavel: "-" },
  { categoria: "Ponto de Equilíbrio", valor: 243594, variavel: "-" },
];

export default function Page() {
  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <FCard>
        <FCardHeader
          title="Ponto de Equilíbrio (Break Even)"
          subtitle="Cálculo estruturado entre receitas, custos e margem de contribuição"
        />
        <FCardContent>
          <div className="grid gap-4 md:grid-cols-3 text-xs md:text-sm">
            <div>
              <p className="text-slate-400">Ano referência</p>
              <p className="font-medium">2025</p>
            </div>
            <div>
              <p className="text-slate-400">Meses considerados</p>
              <p className="font-medium">9 meses</p>
            </div>
            <div>
              <p className="text-slate-400">Origem dos Dados</p>
              <p className="font-medium text-emerald-400">Automático — Supabase</p>
            </div>
          </div>
        </FCardContent>
      </FCard>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-4">

        <FCard>
          <FCardHeader title="Receita Média" />
          <FCardContent>
            <p className="text-2xl font-semibold">
              R$ {262689?.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">Média mensal</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Despesas Fixas" />
          <FCardContent>
            <p className="text-2xl font-semibold text-amber-300">
              R$ {217101?.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">Custo estrutural</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Despesas Variáveis" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ {28600?.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Percentual: 10,88%</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Ponto de Equilíbrio" />
          <FCardContent>
            <p className="text-2xl font-semibold text-emerald-400">
              R$ {243594?.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">Meta mínima mensal</p>
          </FCardContent>
        </FCard>

      </div>

      {/* Gráfico principal */}
      <FCard>
        <FCardHeader
          title="Análise Gráfica"
          subtitle="Comparação entre custos e equilíbrio operacional"
        />
        <FCardContent>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={equilibrioGraph}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="nome" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderColor: "#1e293b",
                    borderRadius: 12,
                  }}
                />
                <Bar
                  dataKey="valor"
                  fill="#38bdf8"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FCardContent>
      </FCard>

      {/* Tabela */}
      <FCard>
        <FCardHeader
          title="Tabela de Composição"
          subtitle="Valores usados no cálculo do ponto de equilíbrio"
        />
        <FCardContent>
          <table className="w-full text-left text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400">
                <th>Categoria</th>
                <th>Valor (R$)</th>
                <th>Variável (%)</th>
              </tr>
            </thead>
            <tbody>
              {tabela.map((linha, i) => (
                <tr key={i} className="bg-slate-900/40 rounded-xl overflow-hidden">
                  <td className="py-2 px-2">{linha.categoria}</td>
                  <td className="py-2 px-2">{linha.valor.toLocaleString()}</td>
                  <td className="py-2 px-2">{linha.variavel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </FCardContent>
      </FCard>

    </div>
  );
}
