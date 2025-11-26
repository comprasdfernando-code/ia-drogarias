"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="anne-header">
      <div className="anne-header-container">

        {/* LOGO */}
        <div className="anne-logo">
          <Image
            src="/clinicas/draannedayane/logo.png"
            width={60}
            height={60}
            alt="Logo Dra Anne Dayane"
          />
          <span className="anne-logo-text">Dra. Anne Dayane</span>
        </div>

        {/* MENU DESKTOP */}
        <nav className="anne-menu">
          <Link href="#inicio">Início</Link>
          <Link href="#sobre">Sobre</Link>
          <Link href="#tratamentos">Tratamentos</Link>
          <Link href="#antesdepois">Antes e Depois</Link>
          <Link href="#contato">Contato</Link>
        </nav>

        {/* INSTAGRAM + AGENDAR (DESKTOP) */}
        <div className="anne-header-right">
          <a
            href="https://instagram.com/dra.annedayane"
            target="_blank"
            className="anne-header-insta"
          >
            <span className="insta-icon">📸</span>
            @dra.annedayane
          </a>

          <a
            href="https://wa.me/5512992240765"
            className="anne-header-agendar"
            target="_blank"
          >
            Agendar
          </a>

          {/* BOTÃO HAMBÚRGUER - MOBILE */}
          <button
  className={`hamburger ${menuOpen ? "open" : ""}`}
  onClick={() => setMenuOpen(!menuOpen)}
>
  <span></span>
  <span></span>
  <span></span>
</button>

        </div>
      </div>

      {/* MENU MOBILE */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link href="#inicio" onClick={() => setMenuOpen(false)}>Início</Link>
          <Link href="#sobre" onClick={() => setMenuOpen(false)}>Sobre</Link>
          <Link href="#tratamentos" onClick={() => setMenuOpen(false)}>Tratamentos</Link>
          <Link href="#antesdepois" onClick={() => setMenuOpen(false)}>Antes e Depois</Link>
          <Link href="#contato" onClick={() => setMenuOpen(false)}>Contato</Link>

          <a
            href="https://instagram.com/dra.annedayane"
            target="_blank"
            className="mm-insta"
          >
            📸 Instagram
          </a>
          <a
            href="https://wa.me/5512992240765"
            target="_blank"
            className="mm-agendar"
          >
            Agendar Avaliação
          </a>
        </div>
      )}
    </header>
  );
}
