"use client";

import { useState } from "react";
import "./styles.css";
import Image from "next/image";
import Link from "next/link";

export default function DaniSoundLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage: 'url("/danisound/bg-neon.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* HEADER */}
      <header className="backdrop-blur-xl bg-black/70 border-b border-red-800/40 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14">
              <Image
                src="/danisound/logo.png"
                alt="Logo Dani Sound"
                fill
                className="object-contain drop-shadow-[0_0_20px_rgba(255,0,0,0.6)]"
              />
            </div>
            <h1 className="text-lg font-bold">Dani Sound</h1>
          </div>

          {/* MENU DESKTOP */}
          <nav className="hidden md:flex gap-6 text-sm">
            <Link href="/autoeletrico/danisound">Início</Link>
            <Link href="/autoeletrico/danisound/servicos">Serviços</Link>
            <Link href="/autoeletrico/danisound/produtos">Produtos</Link>
            <Link href="/autoeletrico/danisound/antes-depois">Antes e Depois</Link>
            <Link href="/autoeletrico/danisound/galeria">Galeria</Link>
            <Link href="/autoeletrico/danisound/orcamento">Orçamento</Link>
          </nav>

          {/* BOTÕES DESKTOP */}
          <div className="hidden md:flex items-center gap-3">
            <a
    href="https://www.instagram.com/dani_sound_01/"
    target="_blank"
    className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2 rounded-full shadow-lg shadow-purple-800/40 hover:scale-105 transition"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="white"
      viewBox="0 0 24 24"
      className="w-5 h-5"
    >
      <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.65 0 3 1.35 3 3v10c0 1.65-1.35 3-3 3H7c-1.65 0-3-1.35-3-3V7c0-1.65 1.35-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.75-.88a1.12 1.12 0 11-2.25 0 1.12 1.12 0 012.25 0z"/>
    </svg>
    Instagram
  </a>

            <a
              href="https://wa.me/5511977844066?text=Olá,+quero+um+orçamento!"
              target="_blank"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full shadow-lg shadow-red-900/40"
            >
              WhatsApp
            </a>
          </div>

          {/* HAMBÚRGUER MOBILE */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-3xl font-bold"
          >
            ≡
          </button>
        </div>

        {/* MENU MOBILE */}
        {menuOpen && (
          <div className="md:hidden bg-black/90 px-6 py-4 flex flex-col gap-4 text-lg">
            <Link href="/autoeletrico/danisound" onClick={() => setMenuOpen(false)}>Início</Link>
            <Link href="/autoeletrico/danisound/servicos" onClick={() => setMenuOpen(false)}>Serviços</Link>
            <Link href="/autoeletrico/danisound/produtos" onClick={() => setMenuOpen(false)}>Produtos</Link>
            <Link href="/autoeletrico/danisound/antes-depois" onClick={() => setMenuOpen(false)}>Antes e Depois</Link>
            <Link href="/autoeletrico/danisound/galeria" onClick={() => setMenuOpen(false)}>Galeria</Link>
            <Link href="/autoeletrico/danisound/orcamento" onClick={() => setMenuOpen(false)}>Orçamento</Link>

            {/* Instagram MOBILE */}
            <a
    href="https://www.instagram.com/dani_sound_01/"
    target="_blank"
    className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2 rounded-full shadow-lg shadow-purple-800/40 hover:scale-105 transition"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="white"
      viewBox="0 0 24 24"
      className="w-5 h-5"
    >
      <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.65 0 3 1.35 3 3v10c0 1.65-1.35 3-3 3H7c-1.65 0-3-1.35-3-3V7c0-1.65 1.35-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.75-.88a1.12 1.12 0 11-2.25 0 1.12 1.12 0 012.25 0z"/>
    </svg>
    Instagram
  </a>

            {/* WhatsApp MOBILE */}
            <a
              href="https://wa.me/5511977844066?text=Olá,+quero+um+orçamento!"
              target="_blank"
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full font-bold"
            >
              WhatsApp
            </a>
          </div>
        )}
      </header>

      {/* CONTEÚDO */}
      <main className="max-w-6xl mx-auto px-4 py-10">{children}</main>

      {/* FOOTER */}
      <footer className="text-center text-sm py-10 opacity-70">
        © {new Date().getFullYear()} Dani Sound – Desenvolvido com IA ❤️⚡
      </footer>

      {/* BOTÃO FLUTUANTE */}
      <a
        href="https://wa.me/5511977844066?text=Olá,+quero+um+orçamento!"
        target="_blank"
        className="fixed bottom-5 right-5 bg-green-500 shadow-xl shadow-green-600/40 hover:bg-green-600 px-5 py-3 rounded-full font-bold"
      >
        WhatsApp
      </a>
    </div>
  );
}
