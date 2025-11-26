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
              href="https://instagram.com/danisound_oficial"
              target="_blank"
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-full shadow-lg shadow-pink-900/40"
            >
              <Image
                src="/icons/instagram.png"
                width={20}
                height={20}
                alt="Instagram"
              />
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
            ≡≡≡≡≡≡
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
              href="https://instagram.com/danisound_oficial"
              target="_blank"
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-full mt-3"
            >
              <Image
                src="/icons/instagram.png"
                width={20}
                height={20}
                alt="Instagram"
              />
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
