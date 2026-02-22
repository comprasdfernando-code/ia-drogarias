"use client";

// app/clinicas/dradudarodrigues/_components/ClinicSidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <aside className="hidden md:flex md:w-72 md:flex-col md:border-r md:border-slate-800 md:bg-slate-950">
      <div className="p-5">
        <div className="text-lg font-semibold">Dra Duda Rodrigues</div>
        <div className="text-xs text-slate-400">Sistema Clínico • v0</div>
      </div>

      <nav className="flex-1 px-3 pb-6">
        <div className="space-y-1">
          {nav.map((item) => {
            const active = path === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "block rounded-xl px-3 py-2 text-sm",
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-300 hover:bg-slate-900/60 hover:text-white",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}