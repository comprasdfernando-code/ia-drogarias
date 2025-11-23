"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function HeaderDanisound() {
  const [open, setOpen] = useState(false);

  return (
    <header className="backdrop-blur-xl bg-black/70 border-b border-red-800/40 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16">
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

        {/* WHATSAPP */}
        <a
          href="https://wa.me/5511977844066?text=Olá,+quero+um+orçamento!"
          target="_blank"
          className="hidden md:block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full shadow-lg shadow-red-900/40"
        >
          WhatsApp
        </a>

        {/* HAMBÚRGUER MOBILE */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-3xl"
        >
          ☰
        </button>
      </div>

      {/* MENU MOBILE */}
      {open && (
        <div className="md:hidden flex flex-col bg-black/90 p-5 text-lg">
          <Link href="/autoeletrico/danisound" onClick={() => setOpen(false)}>Início</Link>
          <Link href="/autoeletrico/danisound/servicos" onClick={() => setOpen(false)}>Serviços</Link>
          <Link href="/autoeletrico/danisound/produtos" onClick={() => setOpen(false)}>Produtos</Link>
          <Link href="/autoeletrico/danisound/antes-depois" onClick={() => setOpen(false)}>Antes e Depois</Link>
          <Link href="/autoeletrico/danisound/galeria" onClick={() => setOpen(false)}>Galeria</Link>
          <Link href="/autoeletrico/danisound/orcamento" onClick={() => setOpen(false)}>Orçamento</Link>

          <a
            href="https://wa.me/5511977844066?text=Olá,+quero+um+orçamento!"
            target="_blank"
            className="mt-4 bg-red-600 py-2 rounded text-center"
          >
            WhatsApp
          </a>
        </div>
      )}
    </header>
  );
}
