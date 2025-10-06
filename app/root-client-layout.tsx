"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react"; // Ícone bonito do carrinho (já vem com shadcn/lucide)

export default function RootClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [itensCarrinho] = useState(3); // 🔹 depois vamos ligar isso ao carrinho real

  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-blue-600 text-white shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          {/* Logo + Nome */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="IA Drogarias" className="h-8 sm:h-10" />
            <span className="font-bold text-lg sm:text-xl">IA Drogarias</span>
          </div>

          {/* Menu Desktop */}
          <nav className="hidden sm:flex gap-3 items-center">
            <Link
              href="/produtos"
              className="px-4 py-2 bg-white text-blue-700 rounded-lg shadow hover:bg-gray-100 transition text-sm font-medium"
            >
              E-commerce
            </Link>
            <Link
              href="/servicos"
              className="px-4 py-2 bg-white text-blue-700 rounded-lg shadow hover:bg-gray-100 transition text-sm font-medium"
            >
              Serviços
            </Link>

            {/* Carrinho */}
            <Link
              href="/carrinho"
              className="relative flex items-center bg-white text-blue-700 px-3 py-2 rounded-lg shadow hover:bg-gray-100 transition"
            >
              <ShoppingCart size={18} />
              {itensCarrinho > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-1.5 rounded-full">
                  {itensCarrinho}
                </span>
              )}
            </Link>

            <Link
              href="/login"
              className="px-4 py-2 bg-white text-blue-700 rounded-lg shadow hover:bg-gray-100 transition text-sm font-medium"
            >
              Entrar / Cadastrar
            </Link>
          </nav>

          {/* Menu Mobile (Hamburguer) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden text-2xl focus:outline-none"
          >
            ☰
          </button>
        </div>

        {/* Menu Mobile Aberto */}
        {menuOpen && (
          <div className="sm:hidden bg-white text-blue-700 flex flex-col items-center py-3 space-y-2 border-t border-blue-100">
            <Link
              href="/produtos"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-2 hover:bg-blue-50 transition"
            >
              E-commerce
            </Link>
            <Link
              href="/servicos"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-2 hover:bg-blue-50 transition"
            >
              Serviços
            </Link>
            <Link
              href="/carrinho"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-2 hover:bg-blue-50 transition"
            >
              🛒 Carrinho ({itensCarrinho})
            </Link>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center py-2 hover:bg-blue-50 transition"
            >
              Entrar / Cadastrar
            </Link>
          </div>
        )}
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-grow p-4 sm:p-6">{children}</main>

      {/* RODAPÉ */}
      <footer className="bg-gray-800 text-white text-center p-4 mt-10">
        <p>© 2025 IA Drogarias - Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
