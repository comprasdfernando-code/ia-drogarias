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
    <aside className="hidden md:flex md:w-72 md:flex-col border-r border-[#2a1c2f]/70 bg-[#06030a]/70 backdrop-blur-md">
      {/* Header */}
      <div className="p-6 border-b border-[#2a1c2f]/60">
        <div className="text-lg font-semibold text-[#f7d9c4] tracking-wide">
          Dra Duda Rodrigues
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Sistema Clínico • v0
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {nav.map((item) => {
            const active = path === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "block rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 border",
                  active
                    ? // ativo dourado
                      "bg-gradient-to-r from-[#f7d9c4] via-[#fff2d9] to-[#f2caa2] text-slate-900 border-[#b88a5a]/60 shadow-[0_0_0_1px_rgba(184,138,90,0.25)]"
                    : // normal
                      "border-transparent text-slate-300 hover:bg-[#0b0612]/60 hover:border-[#b88a5a]/25 hover:text-[#f7d9c4]",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Rodapé elegante */}
      <div className="p-4 border-t border-[#2a1c2f]/60 text-xs text-slate-500">
        Estética & Harmonização
      </div>
    </aside>
  );
}