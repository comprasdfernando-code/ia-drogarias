"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, LineChart, BarChart2, PieChart, Wallet, 
  ShieldAlert, FileText, Activity 
} from "lucide-react";

const menu = [
  { href: "/financeiro", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/financeiro/faturamento-total", icon: LineChart, label: "Faturamento Total" },
  { href: "/financeiro/faturamento-fomento", icon: BarChart2, label: "Faturamento x Fomento" },
  { href: "/financeiro/curva-abc", icon: PieChart, label: "Curva ABC" },
  { href: "/financeiro/endividamento-total", icon: Wallet, label: "Endividamento Total" },
  { href: "/financeiro/risco-total", icon: ShieldAlert, label: "Risco Total" },
  { href: "/financeiro/dre", icon: FileText, label: "DRE" },
  { href: "/financeiro/dre-detalhamento", icon: FileText, label: "DRE Detalhamento" },
  { href: "/financeiro/ponto-equilibrio", icon: Activity, label: "Ponto de Equilíbrio" },
];

export default function SidebarFinanceiro() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col">
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="text-xs uppercase tracking-[0.2em] text-sky-400">
          IA Drogarias
        </div>
        <div className="mt-2 text-lg font-semibold">Financeiro</div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menu.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition
                ${
                  active
                    ? "bg-sky-600 text-white shadow"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
        Módulo • Financeiro IA Drogarias
      </div>
    </aside>
  );
}
