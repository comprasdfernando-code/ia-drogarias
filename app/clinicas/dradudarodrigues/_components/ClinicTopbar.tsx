"use client";

// app/clinicas/dradudarodrigues/_components/ClinicTopbar.tsx
import { usePathname } from "next/navigation";
import { DUDA_THEME } from "../_lib/theme";

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
    <header className="sticky top-0 z-20 border-b border-[#f2caa2]/15 bg-[#07030b]/70 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-4 md:px-8">
        <div>
          <div className="text-sm md:text-base text-slate-300">
            Clínicas / <span className="text-[#f2caa2] font-semibold">Dra Duda</span>
          </div>
          <div className="text-xl md:text-2xl font-semibold tracking-tight">{title}</div>
        </div>

        <div className="flex items-center gap-3">
          <span className={DUDA_THEME.badge}>Status: MVP</span>
        </div>
      </div>
    </header>
  );
}