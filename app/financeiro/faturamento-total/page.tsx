"use client";

import {
  FCard,
  FCardHeader,
  FCardContent,
} from "../../financeiro/ui/card";
import LineBasicChart from "@/components/charts/line-basic";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const dadosMensais = [
  { name: "jan", value: 598 },
  { name: "fev", value: 365 },
  { name: "mar", value: 716 },
  { name: "abr", value: 631 },
  { name: "mai", value: 683 },
];

const dadosProdutoServiço = [
  { name: "Serviços", value: 92 },
  { name: "Produtos", value: 8 },
];

const COLORS = ["#38bdf8", "#71717a"];

export default function Page() {
  return (
    <div className="space-y-6">

      {/* CARD CABEÇALHO */}
      <FCard>
        <FCardHeader
          title="Faturamento Total"
          subtitle="Visão consolidada do faturamento anual"
        />
        <FCardContent>
          <div className="grid gap-4 md:grid-cols-3 text-xs md:text-sm">
            <div>
              <p className="text-slate-400">Ano referência</p>
              <p className="font-medium">2025</p>
            </div>
            <div>
              <p className="text-slate-400">Atualização</p>
              <p className="font-medium">Automática (Supabase)</p>
            </div>
            <div>
              <p className="text-slate-400">Status</p>
              <p className="font-medium text-emerald-400">Ativo</p>
            </div>
          </div>
        </FCardContent>
      </FCard>

      {/* CARDS RESUMIDOS */}
      <div className="grid gap-4 md:grid-cols-4">

        <FCard>
          <FCardHeader title="Faturamento Total" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 6.383.192</p>
            <p className="text-xs text-emerald-400 mt-1">
              +12% nos últimos 12 meses
            </p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Média Mensal" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 532.000</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Maior Faturamento" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 716.920</p>
            <p className="text-xs text-slate-400 mt-1">Março</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Menor Faturamento" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 365.950</p>
            <p className="text-xs text-slate-400 mt-1">Fevereiro</p>
          </FCardContent>
        </FCard>

      </div>

      {/* GRÁFICO 1 — EVOLUÇÃO MENSAL */}
      <FCard>
        <FCardHeader
          title="Evolução Mensal do Faturamento"
          subtitle="Movimento de faturamento ao longo do ano"
        />
        <FCardContent>
          <LineBasicChart data={dadosMensais} />
        </FCardContent>
      </FCard>

      {/* GRÁFICO 2 — PRODUTO X SERVIÇO */}
      <FCard>
        <FCardHeader
          title="Faturamento – Produto x Serviço"
          subtitle="Distribuição percentual"
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
                  data={dadosProdutoServiço}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {dadosProdutoServiço.map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            *Valores mockados – depois conectamos no Supabase
          </p>
        </FCardContent>
      </FCard>

      {/* TABELA */}
      <FCard>
        <FCardHeader
          title="Tabela Comparativa Mensal"
          subtitle="Resumo por mês"
        />
        <FCardContent>
          <table className="w-full text-left text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400">
                <th>Mês</th>
                <th>Faturamento (R$)</th>
                <th>Variação</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["jan", "598.076", "+3%"],
                ["fev", "365.950", "-9%"],
                ["mar", "716.920", "+21%"],
                ["abr", "631.810", "+8%"],
                ["mai", "683.376", "+4%"],
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

    </div>
  );
}
