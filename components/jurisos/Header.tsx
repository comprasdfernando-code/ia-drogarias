"use client";

import {
  Bell,
  Search,
  Plus,
} from "lucide-react";

export default function Header() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">

      <div className="relative w-[500px]">
        <Search
          className="absolute left-4 top-3 text-slate-400"
          size={18}
        />

        <input
          placeholder="Pesquisar processos, clientes..."
          className="w-full rounded-xl border px-12 py-3 outline-none focus:border-blue-600"
        />
      </div>

      <div className="flex items-center gap-4">

        <button className="rounded-xl bg-blue-600 px-5 py-3 text-white flex items-center gap-2">
          <Plus size={18}/>
          Novo Processo
        </button>

        <button className="relative">
          <Bell />

          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            4
          </span>
        </button>

        <img
          src="/avatar.png"
          className="h-11 w-11 rounded-full"
        />

      </div>

    </header>
  );
}