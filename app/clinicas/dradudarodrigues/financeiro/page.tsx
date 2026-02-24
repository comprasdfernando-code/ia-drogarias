"use client";

export default function FinanceiroPage() {
  return (
    <div className="p-6">
      <div className="text-sm text-slate-500">Clínicas / Dra Duda</div>
      <h1 className="text-2xl font-semibold text-slate-900">Financeiro</h1>

      <div className="mt-6 rounded-[28px] border bg-slate-100 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-semibold text-slate-900">Resumo financeiro</div>
            <div className="text-sm text-slate-500">
              Entradas, saídas e repasses (MVP).
            </div>
          </div>

          <div className="flex gap-2">
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              Lançamento
            </button>
            <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800">
              Exportar
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Card title="Receita (mês)" value="R$ 0,00" sub="procedimentos e consultas" />
          <Card title="Despesas (mês)" value="R$ 0,00" sub="custos e taxas" />
          <Card title="Resultado" value="R$ 0,00" sub="líquido estimado" />
        </div>

        <div className="mt-5 rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">Últimos lançamentos</div>
          <div className="mt-3 rounded-xl border px-4 py-10 text-center text-sm text-slate-500">
            Nenhum lançamento encontrado.
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Próximo passo: criar tabelas (recebimentos, despesas, repasses) e amarrar com Agenda/Atendimentos.
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}