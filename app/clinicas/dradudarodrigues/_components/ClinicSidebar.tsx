"use client";

// app/clinicas/dradudarodrigues/_components/ClinicSidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DUDA_THEME } from "../_lib/theme";

const nav = [
  { href: "/clinicas/dradudarodrigues/dashboard", label: "Dashboard" },
  { href: "/clinicas/dradudarodrigues/pacientes", label: "Pacientes" },
  { href: "/clinicas/dradudarodrigues/agenda", label: "Agenda" },
  { href: "/clinicas/dradudarodrigues/documentos", label: "Documentos" },
  { href: "/clinicas/dradudarodrigues/automacoes", label: "Automações" },
  { href: "/clinicas/dradudarodrigues/crm", label: "CRM" },
  { href: "/clinicas/dradudarodrigues/financeiro", label: "Financeiro" },
  { href: "/clinicas/dradudarodrigues/relatorios", label: "Relatórios" },
  { href: "/clinicas/dradudarodrigues/configuracoes", label: "Configurações" },
];

export default function ClinicSidebar() {
  const path = usePathname();

  return (
    <aside className="hidden md:flex md:w-[280px] md:flex-col md:border-r md:border-[#f2caa2]/15 md:bg-[#07030b]/75 md:backdrop-blur">
      <div className="p-6">
        <div className="text-xl font-semibold tracking-tight text-[#f2caa2]">
          Dra Duda Rodrigues
        </div>
        <div className="mt-1 text-sm text-slate-300">Sistema Clínico • v0</div>
      </div>

      <nav className="flex-1 px-4 pb-6">
        <div className="space-y-2">
          {nav.map((item) => {
            const active = path === item.href || path?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "block rounded-xl px-4 py-3 text-sm md:text-base transition",
                  "border",
                  active
                    ? "bg-[#140a18]/70 text-white border-[#f2caa2]/25 shadow-[0_0_0_1px_rgba(242,202,162,0.10)]"
                    : "text-slate-200 border-transparent hover:bg-[#140a18]/45 hover:border-[#f2caa2]/15",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-6 pb-6">
        <div className="text-xs md:text-sm text-slate-400">
          Estética & Harmonização
        </div>
        <div className="mt-2 h-px w-full bg-[#f2caa2]/10" />
        <div className="mt-3 text-xs md:text-sm text-slate-300">
          Tema: <span className="text-[#f2caa2]">rosé + dourado</span>
        </div>
      </div>
    </aside>
  );
}