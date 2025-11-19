"use client";

import {
  FCard,
  FCardHeader,
  FCardContent,
} from "../../financeiro/ui/card";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const dadosLinha = [
  { name: "jan", faturamento: 598, clean: 0.42 },
  { name: "fev", faturamento: 365, clean: 0.32 },
  { name: "mar", faturamento: 716, clean: 0.58 },
  { name: "abr", faturamento: 631, clean: 0.47 },
  { name: "mai", faturamento: 683, clean: 0.55 },
];

const dadosBarra = [
  { name: "jan", valor: 210 },
  { name: "fev", valor: 180 },
  { name: "mar", valor: 260 },
  { name: "abr", valor: 195 },
  { name: "mai", valor: 230 },
];

export default function Page() {
  return (
    <div className="space-y-6">

      {/* CABEÇALHO */}
      <FCard>
        <FCardHeader
          title="Faturamento x Fomento"
          subtitle="Análise comparativa entre faturamento bruto e captação via fomento"
        />
        <FCardContent>
          <div className="grid gap-4 md:grid-cols-3 text-xs md:text-sm">
            <div>
              <p className="text-slate-400">Ano referência</p>
              <p className="font-medium">2025</p>
            </div>
            <div>
              <p className="text-slate-400">Fomento ativo</p>
              <p className="font-medium text-emerald-400">Sim</p>
            </div>
            <div>
              <p className="text-slate-400">Status</p>
              <p className="font-medium text-emerald-400">Análise Atualizada</p>
            </div>
          </div>
        </FCardContent>
      </FCard>

      {/* CARDS */}
      <div className="grid gap-4 md:grid-cols-4">

        <FCard>
          <FCardHeader title="Total Faturado" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 6.383.192</p>
            <p className="text-xs text-emerald-400 mt-1">+12% no ano</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Total CLEAN" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 982.000</p>
            <p className="text-xs text-slate-400 mt-1">Entradas via fomento</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Maior Captação" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 260.000</p>
            <p className="text-xs text-slate-400 mt-1">Março</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Menor Captação" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 180.000</p>
            <p className="text-xs text-slate-400 mt-1">Fevereiro</p>
          </FCardContent>
        </FCard>

      </div>

      {/* GRÁFICO DE LINHA */}
      <FCard>
        <FCardHeader
          title="Comparação – CLEAN x Faturamento"
          subtitle="Visão da relação mensal"
        />
        <FCardContent>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={dadosLinha}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#9ca3af" />
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
                  dataKey="faturamento"
                  stroke="#38bdf8"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="clean"
                  stroke="#34d399"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </FCardContent>
      </FCard>

      {/* GRÁFICO DE BARRAS */}
      <FCard>
        <FCardHeader
          title="Captação de Fomento – Valor Mensal"
          subtitle="Entradas registradas por período"
        />
        <FCardContent>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={dadosBarra}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020617",
                    borderColor: "#1f293b",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="valor" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FCardContent>
      </FCard>

      {/* TABELA */}
      <FCard>
        <FCardHeader
          title="Resumo por Mês"
          subtitle="Totais de faturamento e fomento"
        />
        <FCardContent>
          <table className="w-full text-left text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-slate-400">
                <th>Mês</th>
                <th>Faturamento (R$)</th>
                <th>CLEAN (R$)</th>
                <th>Participação</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["jan", "598.076", "210.000", "35%"],
                ["fev", "365.950", "180.000", "49%"],
                ["mar", "716.920", "260.000", "36%"],
                ["abr", "631.810", "195.000", "31%"],
                ["mai", "683.376", "230.000", "33%"],
              ].map((item, i) => (
                <tr
                  key={i}
                  className="bg-slate-900/40 rounded-xl overflow-hidden"
                >
                  <td className="py-2 px-1">{item[0]}</td>
                  <td className="py-2 px-1 font-medium">{item[1]}</td>
                  <td className="py-2 px-1">{item[2]}</td>
                  <td className="py-2 px-1 text-emerald-400">{item[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </FCardContent>
      </FCard>

    </div>
  );
}
