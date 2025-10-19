"use client";

import { useState } from "react";
import Link from "next/link";
// sem dependências externas

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="bg-blue-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="IA Drogarias" className="h-8 w-8" />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm">IA Drogarias</span>
            <span className="text-[11px] text-blue-100">Saúde com Inteligência</span>
          </div>
        </Link>

        {/* Botões desktop */}
        <nav className="hidden md:flex items-center gap-4">
          <Link href="/drogarias/drogariaredefabiano" className="bg-white text-blue-700 px-3 py-1 rounded font-medium hover:bg-blue-50">
            Drogaria Rede Fabiano
          </Link>
          <Link href="/servicos" className="bg-white text-blue-700 px-3 py-1 rounded font-medium hover:bg-blue-50">
            Serviços
          </Link>
          <Link href="/login" className="bg-white text-blue-700 px-3 py-1 rounded font-medium hover:bg-blue-50">
            Entrar / Cadastrar
          </Link>
        </nav>

        {/* Menu Mobile */}
      <button
        onClick={() => setMenuAberto(!menuAberto)}
        className="md:hidden bg-blue-600 p-2 rounded text-xl hover:bg-blue-800 transition"
      >
       ☰
      </button>
      </div>

      {/* Menu dropdown (aparece ao clicar nos 3 pontinhos) */}
      {menuAberto && (
        <div className="md:hidden bg-blue-600 text-white px-4 py-3 space-y-2 border-t border-blue-500">
          <Link href="/produtos" className="block hover:text-blue-200">
            🛒 E-commerce
          </Link>
          <Link href="/servicos" className="block hover:text-blue-200">
            💊 Serviços
          </Link>
          <Link href="/login" className="block hover:text-blue-200">
            👤 Entrar / Cadastrar
          </Link>
        </div>
      )}
    </header>
  );
}