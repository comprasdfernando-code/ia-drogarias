"use client";

import "../globals.css";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export const metadata = {
  title: "IMOVEIS RÁPIDO – Encontre seu imóvel rápido e fácil",
  description: "Plataforma de anúncios imobiliários rápida e moderna.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">

      {/* HEADER */}
      <header className="w-full bg-white shadow-md py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          
          {/* LOGO */}
          <div className="flex items-center gap-2">
            <Image
              src="/imoveisrapido/logo.png"
              alt="Logo Imoveis Rapido"
              width={48}
              height={48}
            />
            <span className="text-2xl font-bold text-blue-700">IMOVEIS RÁPIDO</span>
          </div>

          {/* MENU DESKTOP */}
          <nav className="hidden md:flex gap-6 text-lg font-medium">
            <Link href="/imoveisrapido" className="hover:text-blue-600">Início</Link>
            <Link href="#" className="hover:text-blue-600">Imóveis</Link>
            <Link href="#" className="hover:text-blue-600">Anunciar</Link>
            <Link href="#" className="hover:text-blue-600">Corretores</Link>
          </nav>

          {/* BOTÃO HAMBÚRGUER – MOBILE */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-blue-700 focus:outline-none"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              {!open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
          </button>
        </div>

        {/* MENU MOBILE EXPANDIDO */}
        {open && (
          <div className="md:hidden bg-white shadow-lg px-4 py-4 flex flex-col gap-4 text-lg font-medium">
            <Link href="/imoveisrapido" onClick={() => setOpen(false)} className="hover:text-blue-600">
              Início
            </Link>
            <Link href="#" onClick={() => setOpen(false)} className="hover:text-blue-600">
              Imóveis
            </Link>
            <Link href="#" onClick={() => setOpen(false)} className="hover:text-blue-600">
              Anunciar
            </Link>
            <Link href="#" onClick={() => setOpen(false)} className="hover:text-blue-600">
              Corretores
            </Link>
          </div>
        )}
      </header>

      {/* MAIN */}
      <main className="flex-1">{children}</main>

      {/* FOOTER */}
      <footer className="bg-blue-900 text-white mt-16 py-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">

          <div>
            <h3 className="text-xl font-bold mb-3">IMOVEIS RÁPIDO</h3>
            <p className="text-gray-200">
              O jeito mais rápido de conectar compradores, vendedores e corretores.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">Links úteis</h4>
            <ul className="space-y-2 text-gray-200">
              <li><Link href="/imoveisrapido" className="hover:text-white">Início</Link></li>
              <li><Link href="#" className="hover:text-white">Anunciar imóvel</Link></li>
              <li><Link href="#" className="hover:text-white">Imóveis disponíveis</Link></li>
              <li><Link href="#" className="hover:text-white">Corretores</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">Aviso Legal</h4>
            <p className="text-gray-200 text-sm">
              A plataforma IMOVEIS RÁPIDO atua apenas como serviço de anúncios.
              Não realiza corretagem imobiliária ou intermediação de contratos.
            </p>
          </div>
        </div>

        <div className="text-center text-gray-300 mt-6">
          © {new Date().getFullYear()} IMOVEIS RÁPIDO — Todos os direitos reservados.
        </div>
      </footer>

    </div>
  );
}
