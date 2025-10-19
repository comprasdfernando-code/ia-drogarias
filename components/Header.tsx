"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react"; // ícones do menu e fechar

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="bg-blue-700 text-white shadow-md sticky top-0 z-50">
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
          <Link
            href="/drogarias/drogariaredefabiano"
            className="bg-white text-blue-700 px-3 py-1 rounded font-medium hover:bg-blue-50"
          >
            Drogaria Rede Fabiano
          </Link>
          <Link
            href="/servicos"
            className="bg-white text-blue-700 px-3 py-1 rounded font-medium hover:bg-blue-50"
          >
            Serviços
          </Link>
          <Link
            href="/login"
            className="bg-white text-blue-700 px-3 py-1 rounded font-medium hover:bg-blue-50"
          >
            Entrar / Cadastrar
          </Link>
        </nav>

        {/* Menu Mobile (botão 3 pontinhos) */}
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="md:hidden bg-blue-600 p-2 rounded hover:bg-blue-800 transition"
        >
          {menuAberto ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Menu Dropdown Mobile */}
      {menuAberto && (
        <div className="md:hidden bg-blue-600 text-white px-4 py-3 space-y-2 border-t border-blue-500">
          <Link
            href="/drogarias/drogariaredefabiano"
            className="block hover:text-blue-200"
            onClick={() => setMenuAberto(false)}
          >
            🩺 Drogaria Rede Fabiano
          </Link>
          <Link
            href="/servicos"
            className="block hover:text-blue-200"
            onClick={() => setMenuAberto(false)}
          >
            💊 Serviços
          </Link>
          <Link
            href="/login"
            className="block hover:text-blue-200"
            onClick={() => setMenuAberto(false)}
          >
            👤 Entrar / Cadastrar
          </Link>
        </div>
      )}
    </header>
  );
}