export default function RelatoriosPage() {
  return (
    <div className="p-6">
      <div className="text-sm text-slate-500">Clínicas / Dra Duda</div>
      <h1 className="text-2xl font-semibold text-slate-900">Relatórios</h1>

      <div className="mt-6 rounded-[28px] border bg-slate-100 p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold text-slate-900">Relatórios</div>
          <div className="text-sm text-slate-500">
            Indicadores de consultas, pacientes e financeiro (MVP).
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Box title="Consultas por período" desc="volume e status" />
          <Box title="Pacientes (novos x recorrentes)" desc="base e retorno" />
          <Box title="Faturamento por procedimento" desc="mix de serviços" />
        </div>

        <div className="mt-5 rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">Em breve</div>
          <div className="mt-3 text-sm text-slate-600">
            Aqui a gente pluga gráficos e exportação PDF/Excel.
          </div>
        </div>
      </div>
    </div>
  );
}

function Box({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{desc}</div>
      <div className="mt-4 rounded-xl border px-4 py-8 text-center text-sm text-slate-500">
        Sem dados ainda.
      </div>
    </div>
  );
}