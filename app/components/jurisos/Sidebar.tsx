"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Calendar,
  Gavel,
  Clock3,
  FileText,
  Wallet,
  BrainCircuit,
  Settings,
} from "lucide-react";

const menus = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/jurisos" },
  { icon: FolderOpen, label: "Processos", href: "/jurisos/processos" },
  { icon: Users, label: "Clientes", href: "/jurisos/clientes" },
  { icon: Calendar, label: "Agenda", href: "/jurisos/agenda" },
  { icon: Gavel, label: "Audiências", href: "/jurisos/audiencias" },
  { icon: Clock3, label: "Prazos", href: "/jurisos/prazos" },
  { icon: FileText, label: "Documentos", href: "/jurisos/documentos" },
  { icon: Wallet, label: "Financeiro", href: "/jurisos/financeiro" },
  { icon: BrainCircuit, label: "JurisIA", href: "/jurisos/jurisia" },
  { icon: Settings, label: "Configurações", href: "/jurisos/configuracoes" },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="h-20 flex items-center px-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">JurisOS</h1>
          <span className="text-xs text-slate-400">
            Sistema Operacional Jurídico
          </span>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {menus.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 transition hover:bg-blue-600 hover:text-white"
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}