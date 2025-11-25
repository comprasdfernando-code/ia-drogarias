"use client";

import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-[#05070A]/70 border-b border-white/10 shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">

        {/* LOGO */}
        <Link href="/sistemas/techfernandopereira" className="flex items-center gap-3">
          <Image
            src="/tech-fernando-pereira.png"
            alt="Tech Fernando Pereira logo"
            width={48}
            height={48}
            className="rounded-full"
          />
          <span className="text-xl font-bold tracking-tight">
            Tech FP
          </span>
        </Link>

        {/* MENU DESKTOP */}
        <nav className="hidden md:flex items-center gap-8 text-gray-300 text-sm">
          <Link href="#portfolio" className="hover:text-white transition">Portfólio</Link>
          <Link href="#services" className="hover:text-white transition">Serviços</Link>
          <Link href="#sobre" className="hover:text-white transition">Sobre Mim</Link>
          <Link
            href="https://wa.me/5511964819472?text=Olá!%20Quero%20fazer%20um%20site%20ou%20sistema."
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-semibold"
          >
            Contato
          </Link>
        </nav>

        {/* MOBILE BUTTON (futuro menu) */}
        <div className="md:hidden text-white text-2xl">
          ☰
        </div>

      </div>
    </header>
  );
}
