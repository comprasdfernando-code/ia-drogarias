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
    <header className="sticky top-0 z-20 border-b border-[#2a1c2f]/70 bg-[#06030a]/65 backdrop-blur-md">
      {/* glow superior sutil */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#b88a5a]/40 to-transparent" />

      <div className="flex items-center justify-between px-4 py-4 md:px-6">
        <div>
          <div className="text-sm text-slate-400">
            Clínicas / <span className="text-[#f7d9c4]">Dra Duda</span>
          </div>
          <div className="text-lg font-semibold text-slate-100 tracking-wide">
            {title}
          </div>
        </div>

        {/* Status badge elegante */}
        <div className="text-xs">
          <span className="mr-2 text-slate-400">Status:</span>
          <span className="rounded-full bg-gradient-to-r from-[#f7d9c4] via-[#fff2d9] to-[#f2caa2] text-slate-900 px-3 py-1 font-medium border border-[#b88a5a]/50 shadow-[0_0_0_1px_rgba(184,138,90,0.25)]">
            MVP
          </span>
        </div>
      </div>
    </header>
  );
}