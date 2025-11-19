"use client";

import { Bell, User } from "lucide-react";

export default function TopbarFinanceiro() {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-3 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Painel Financeiro
        </h1>
        <p className="text-xs text-slate-400">Análises executivas do grupo</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full border border-slate-700 hover:bg-slate-800">
          <Bell size={16} />
        </button>
        <div className="flex items-center gap-2 border border-slate-700 rounded-full px-3 py-1">
          <User size={14} />
          <span className="text-xs">Admin</span>
        </div>
      </div>
    </header>
  );
}
