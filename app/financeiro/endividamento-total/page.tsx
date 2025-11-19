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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

// MOCK — depois será abastecido através do Supabase
const dividaReceita = [
  { name: "Dívida", value: 1783809 },
  { name: "Receita", value: 6383192 },
];

const COLORS = ["#ef4444", "#38bdf8"];

const evolucao = [
  { mes: "jan", valor: 1710000 },
  { mes: "fev", valor: 1695000 },
  { mes: "mar", valor: 1783000 },
  { mes: "abr", valor: 1769000 },
  { mes: "mai", valor: 1783809 },
];

const instituicoes = [
  { inst: "C6 Bank", valor: 520000, taxa: "1,89%", risco: "Médio" },
  { inst: "Mercado Pago", valor: 310000, taxa: "2,10%", risco: "Médio" },
  { inst: "Stone", valor: 240000, taxa: "1,75%", risco: "Baixo" },
  { inst: "Sicoob", valor: 355000, taxa: "2,40%", risco: "Alto" },
  { inst: "BV Financeira", valor: 354809, taxa: "2,19%", risco: "Médio" },
];

export default function Page() {
  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <FCard>
        <FCardHeader
          title="Endividamento Total"
          subtitle="Análise consolidada de dívidas e compromissos financeiros"
        />
        <FCardContent>
          <div className="grid gap-4 md:grid-cols-3 text-xs md:text-sm">
            <div>
              <p className="text-slate-400">Ano referência</p>
              <p className="font-medium">2025</p>
            </div>
            <div>
              <p className="text-slate-400">Última atualização</p>
              <p className="font-medium">Hoje – 100% automático</p>
            </div>
            <div>
              <p className="text-slate-400">Status</p>
              <p className="font-medium text-emerald-400">Monitoramento ativo</p>
            </div>
          </div>
        </FCardContent>
      </FCard>

      {/* Cards Resumo */}
      <div className="grid gap-4 md:grid-cols-4">

        <FCard>
          <FCardHeader title="Dívida Total" />
          <FCardContent>
            <p className="text-2xl font-semibold text-red-400">R$ 1.783.809</p>
            <p className="text-xs text-slate-400 mt-1">Comprometimento atual</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Comprometimento (%)" />
          <FCardContent>
            <p className="text-2xl font-semibold text-amber-300">27,9%</p>
            <p className="text-xs text-slate-400 mt-1">Dívida / Receita</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Instituições Ativas" />
          <FCardContent>
            <p className="text-2xl font-semibold">5</p>
            <p className="text-xs text-slate-400 mt-1">Bancos e captadores</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Ticket Médio por Instituição" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 356.761</p>
            <p className="text-xs text-slate-400 mt-1">Média de exposição</p>
          </FCardContent>
        </FCard>

      </div>

      {/* Donut — Dívida vs Receita */}
      <FCard>
        <FCardHeader
          title="Dívida x Receita"
          subtitle="Proporção entre endividamento total e faturamento geral"
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
                  data={dividaReceita}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {dividaReceita.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </FCardContent>
      </FCard>

      {/* Linha — Evolução do Endividamento */}
      <FCard>
        <FCardHeader
          title="Evolução do Endividamento"
          subtitle="Movimento recente das dívidas"
        />
        <FCardContent>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={evolucao}>
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
                <Line type="monotone" dataKey="valor" stroke="#ef4444" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </FCardContent>
      </FCard>

      {/* Tabela por Instituição */}
      <FCard>
        <FCardHeader
          title="Endividamento por Instituição"
          subtitle="Detalhamento dos saldos e riscos por banco"
        />
        <FCardContent>
          <table className="w-full text-left text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400">
                <th>Instituição</th>
                <th>Valor (R$)</th>
                <th>Taxa</th>
                <th>Risco</th>
              </tr>
            </thead>
            <tbody>
              {instituicoes.map((item, i) => (
                <tr key={i} className="bg-slate-900/40 rounded-xl overflow-hidden">
                  <td className="py-2 px-1">{item.inst}</td>
                  <td className="py-2 px-1 font-medium">{item.valor.toLocaleString()}</td>
                  <td className="py-2 px-1">{item.taxa}</td>
                  <td
                    className={`py-2 px-1 ${
                      item.risco === "Alto"
                        ? "text-red-400"
                        : item.risco === "Médio"
                        ? "text-amber-300"
                        : "text-emerald-400"
                    }`}
                  >
                    {item.risco}
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
