"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import { ShoppingCart } from "lucide-react"; // 🛒 Ícone do carrinho

export default function RootClientLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  // 🔹 Busca o usuário logado ao carregar
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const nome = data.user.user_metadata?.nome || data.user.email?.split("@")[0];
        setUserName(nome);
      }
    }

    loadUser();

    // 🔹 Atualiza quando o usuário loga ou sai
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const nome = session.user.user_metadata?.nome || session.user.email?.split("@")[0];
        setUserName(nome);
      } else {
        setUserName(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserName(null);
  };

  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-blue-600 text-white shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">

          {/* 🔹 Logo clicável (volta pra home) */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition">
            <img src="/logo.png" alt="IA Drogarias" className="h-8 sm:h-10 cursor-pointer" />
            <span className="font-bold text-lg sm:text-xl">IA Drogarias</span>
          </Link>

          {/* Menu Desktop */}
          <nav className="hidden sm:flex items-center gap-3">
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

            {/* 🛒 Ícone do Carrinho */}
            <Link
              href="/carrinho"
              className="relative bg-white text-blue-700 rounded-full p-2 shadow hover:bg-gray-100 transition"
              title="Ver carrinho"
            >
              <ShoppingCart size={22} />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">
                2
              </span>
            </Link>

            {/* 🔹 Saudação ou botão de login */}
            {userName ? (
              <div className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-lg shadow text-sm font-medium">
                <span>Olá, {userName.split(" ")[0]} 👋</span>
                <button
                  onClick={handleLogout}
                  className="ml-2 text-red-600 hover:underline text-xs"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-white text-blue-700 rounded-lg shadow hover:bg-gray-100 transition text-sm font-medium"
              >
                Entrar / Cadastrar
              </Link>
            )}
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
            <Link href="/produtos" onClick={() => setMenuOpen(false)} className="w-full text-center py-2 hover:bg-blue-50 transition">
              E-commerce
            </Link>
            <Link href="/servicos" onClick={() => setMenuOpen(false)} className="w-full text-center py-2 hover:bg-blue-50 transition">
              Serviços
            </Link>
            <Link href="/carrinho" onClick={() => setMenuOpen(false)} className="w-full text-center py-2 hover:bg-blue-50 transition">
              🛒 Ver carrinho
            </Link>
            {userName ? (
              <button onClick={handleLogout} className="w-full text-center py-2 text-red-600 hover:bg-blue-50 transition">
                Sair ({userName.split(" ")[0]})
              </button>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="w-full text-center py-2 hover:bg-blue-50 transition">
                Entrar / Cadastrar
              </Link>
            )}
          </div>
        )}
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-grow p-4 sm:p-6">{children}</main>

      {/* RODAPÉ */}
      <footer className="bg-gray-800 text-white text-center p-4 mt-10">
        <p>©️ 2025 IA Drogarias - Todos os direitos reservados</p>
      </footer>
    </div>
  );
}