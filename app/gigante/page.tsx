"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image"; // ⬅️ Melhor prática para imagens no Next.js
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

// ⚠️ Importações do Swiper foram movidas para um arquivo CSS global ou root
import "swiper/css";
import "swiper/css/pagination";
import  NavButtonProps from "../../components/NavButton"; // Ajuste o caminho se necessário (ex: './components/NavButton')

// 🍔 Ícone do Menu Mobile com Heroicons (opcional, mas mais moderno)
const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-8 h-8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
    />
  </svg>
);

// ❌ Ícone de Fechar (opcional)
const XMarkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-8 h-8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// Componente de Botão Reutilizável para Menu
const NavButton = ({ href, children, onClick }) => (
  <Link href={href}>
    <button
      onClick={onClick}
      // 🎨 Estilos padronizados do botão com Tailwind
      className="bg-white text-red-700 font-bold py-2 px-4 rounded-md shadow-md hover:bg-red-100 transition duration-150 ease-in-out text-sm w-full md:w-auto"
    >
      {children}
    </button>
  </Link>
);


export default function GigantePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    // 🎨 Estilos da página principal
    <main className="text-center pt-20 bg-white min-h-screen">
      {/* 🔴 TOPO FIXO RESPONSIVO */}
      <header
        className="fixed top-0 left-0 w-full h-20 bg-red-700 
                   flex items-center justify-between px-5 md:px-10 
                   shadow-xl z-50"
      >
        {/* 🏷️ LOGO À ESQUERDA */}
        <div className="flex items-center gap-2">
          {/* Usando o componente Image do Next.js para otimização */}
          <Image
            src="/gigante-logo.png"
            alt="Gigante dos Assados"
            width={45}
            height={45}
            className="h-[45px] w-auto"
            priority // Opcional: para carregar a logo mais rápido
          />
          <h2 className="text-white font-bold text-xl md:text-2xl">
            Gigante dos Assados
          </h2>
        </div>

        {/* 🍗 BOTÕES À DIREITA (desktop) */}
        <nav className="hidden md:flex gap-4">
          <NavButtonProps href="/gigante/pdv">PDV</NavButtonProps>
          <NavButtonProps href="/gigante/produtos">Produtos</NavButtonProps>
          <NavButtonProps href="/gigante/caixa">Caixa</NavButtonProps>
        </nav>

        {/* 🍔 BOTÃO MOBILE */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white"
          aria-label="Toggle menu"
        >
          {menuOpen ? <XMarkIcon /> : <MenuIcon />}
        </button>
      </header>

      {/* MENU MOBILE (aparece quando abre) */}
      <div
        className={`fixed top-20 right-0 w-full bg-red-700 
                    flex flex-col items-center py-4 px-4 space-y-3 
                    shadow-lg transition-transform duration-300 ease-in-out z-40
                    ${menuOpen ? "translate-y-0" : "-translate-y-full"} 
                    md:hidden`} // ⬅️ Transição moderna!
      >
        <NavButton href="/gigante/pdv" onClick={() => setMenuOpen(false)}>
          PDV
        </NavButton>
        <NavButton href="/gigante/produtos" onClick={() => setMenuOpen(false)}>
          Produtos
        </NavButton>
        <NavButton href="/gigante/caixa" onClick={() => setMenuOpen(false)}>
          Caixa
        </NavButton>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="pt-5 px-4">
        {/* LOGO E FRASE */}
        <h1 className="text-red-700 mb-2 mt-5 text-3xl font-extrabold">
          Gigante dos Assados
        </h1>
        <p className="text-gray-600 mb-8 text-lg">Grande no sabor 🍗</p>

        {/* 🧩 CARROSSEL DE PROMOÇÕES */}
        <div className="max-w-4xl mx-auto mb-10">
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            spaceBetween={20}
            slidesPerView={1}
            // 💡 Responsividade com Tailwind no Swiper (breakpoints do próprio Swiper)
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {/* Array de dados (melhor prática) */}
            {[
              { src: "/promo1.jpeg", alt: "Promoção 1", text: "Frango Assado R$ 49,90" },
              { src: "/promo2.jpeg", alt: "Promoção 2", text: "Combo Família R$ 79,90" },
              { src: "/promo3.jpeg", alt: "Promoção 3", text: "Costela no Bafo R$ 49,90" },
            ].map((promo, index) => (
              <SwiperSlide key={index}>
                <Image
                  src={promo.src}
                  alt={promo.alt}
                  width={300} // Tamanhos necessários para o componente Image
                  height={200}
                  className="w-full h-auto rounded-lg shadow-lg aspect-[3/2] object-cover" // 🎨 Estilos com Tailwind
                />
                <p className="mt-3 font-semibold text-lg">{promo.text}</p>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* 🎥 VÍDEO DE PROPAGANDA */}
        <div className="max-w-xl mx-auto mb-10 text-center">
          <video
            src="/video1.mp4"
            controls
            autoPlay
            muted
            loop
            // 🎨 Estilos com Tailwind
            className="w-full h-auto rounded-xl shadow-2xl"
          />

          <p className="mt-3 font-bold text-red-700 text-sm">
            🍗 Propaganda Oficial - Gigante dos Assados
          </p>
        </div>
      </div>
      
    </main>
  );
}