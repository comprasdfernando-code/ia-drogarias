import { 
  FCard, 
  FCardHeader, 
  FCardContent 
} from "../financeiro/ui/card";
import LineBasicChart from "@/components/charts/line-basic";

const mockFaturamento = [
  { name: "jan", value: 598 },
  { name: "fev", value: 365 },
  { name: "mar", value: 716 },
  { name: "abr", value: 631 },
  { name: "mai", value: 683 },
];

export default function FinanceiroHome() {
  return (
    <div className="space-y-6">

      {/* Card de Cabeçalho */}
      <FCard>
        <FCardHeader
          title="Painel Financeiro IA Drogarias"
          subtitle="Indicadores consolidados do negócio."
        />
        <FCardContent>
          <div className="grid gap-4 md:grid-cols-3 text-xs md:text-sm">
            <div>
              <p className="text-slate-400">Empreendimento</p>
              <p className="font-medium">IA Drogarias – Grupo</p>
            </div>
            <div>
              <p className="text-slate-400">Módulo</p>
              <p className="font-medium">Financeiro & Executivo</p>
            </div>
            <div>
              <p className="text-slate-400">Status</p>
              <p className="font-medium text-emerald-400">Ativo</p>
            </div>
          </div>
        </FCardContent>
      </FCard>

      {/* Cards Resumidos */}
      <div className="grid gap-4 md:grid-cols-4">

        <FCard>
          <FCardHeader title="Faturamento Total" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 6.383.192</p>
            <p className="text-xs text-emerald-400 mt-1">
              +12% em 12 meses
            </p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Margem Bruta" />
          <FCardContent>
            <p className="text-2xl font-semibold">73,5%</p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Endividamento Total" />
          <FCardContent>
            <p className="text-2xl font-semibold text-amber-300">
              R$ 1.783.809
            </p>
          </FCardContent>
        </FCard>

        <FCard>
          <FCardHeader title="Ponto de Equilíbrio" />
          <FCardContent>
            <p className="text-2xl font-semibold">R$ 243.594</p>
          </FCardContent>
        </FCard>

      </div>

      {/* Gráfico Principal */}
      <FCard>
        <FCardHeader
          title="Faturamento – Evolução Mensal"
          subtitle="Visão dos últimos meses"
        />
        <FCardContent>
          <LineBasicChart data={mockFaturamento} />
        </FCardContent>
      </FCard>

    </div>
  );
}
