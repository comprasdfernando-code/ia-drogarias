// app/clinicas/dradudarodrigues/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
        <div className="text-xl font-semibold">Bem-vindo 👋</div>
        <div className="mt-1 text-sm text-slate-300">
          Aqui vamos centralizar pacientes, agenda, prontuário, documentos e automações.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { t: "Pacientes", d: "Cadastro + histórico centralizado" },
          { t: "Agenda", d: "Agendamentos + confirmações" },
          { t: "Documentos", d: "Termos + assinatura digital" },
        ].map((c) => (
          <div
            key={c.t}
            className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5"
          >
            <div className="font-semibold">{c.t}</div>
            <div className="mt-1 text-sm text-slate-300">{c.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}