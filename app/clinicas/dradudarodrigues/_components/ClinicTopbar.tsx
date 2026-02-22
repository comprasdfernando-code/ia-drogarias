"use client";

// app/clinicas/dradudarodrigues/_components/ClinicTopbar.tsx
import { usePathname } from "next/navigation";

function titleFromPath(path: string) {
  const p = path.split("/").filter(Boolean);
  const last = p[p.length - 1] || "dashboard";
  const map: Record<string, string> = {
    dashboard: "Dashboard",
    pacientes: "Pacientes",
    agenda: "Agenda",
    documentos: "Documentos",
    automacoes: "Automações",
    crm: "CRM",
    financeiro: "Financeiro",
    relatorios: "Relatórios",
    configuracoes: "Configurações",
  };
  return map[last] || "Painel";
}

export default function ClinicTopbar() {
  const path = usePathname();
  const title = titleFromPath(path);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div>
          <div className="text-sm text-slate-400">Clínicas / Dra Duda</div>
          <div className="text-lg font-semibold">{title}</div>
        </div>

        <div className="text-xs text-slate-400">
          Status: <span className="text-slate-200">MVP</span>
        </div>
      </div>
    </header>
  );
}