"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [slide, setSlide] = useState(0);

  const fotos = [
    "/f1.jpg",
    "/f2.jpg",
    "/f3.jpg",
    "/f4.jpg",
    "/f5.jpg",
    "/f6.jpg",
    "/f7.jpg",
    "/f8.jpg",
    "/f9.jpg",
  ];

  const next = () => setSlide((slide + 1) % fotos.length);
  const prev = () => setSlide((slide - 1 + fotos.length) % fotos.length);

  return (
    <main className="bg-[#fff7e6] text-[#2a2a2a] min-h-screen">

      {/* HEADER */}
      <header className="w-full bg-yellow-500 p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🍗🔥</span> Gigante dos Assados
        </h1>

        <nav className="hidden md:flex gap-6 font-semibold">
          <a href="#sobre">Sobre</a>
          <a href="#cardapio">Cardápio</a>
          <a href="#contato">Contato</a>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative w-full h-[380px] overflow-hidden">
        <Image
          src={fotos[slide]}
          fill
          alt="Carrossel"
          className="object-cover transition-all duration-700"
        />

        {/* Botões */}
        <button onClick={prev} className="absolute left-2 top-1/2 text-3xl bg-black/40 text-white px-3 py-1 rounded-full">‹</button>
        <button onClick={next} className="absolute right-2 top-1/2 text-3xl bg-black/40 text-white px-3 py-1 rounded-full">›</button>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="p-6 text-center">
        <h2 className="text-3xl font-bold mb-3">🔥 Sobre Nós</h2>
        <p className="text-lg">
          A casa de carnes e frangos assados mais tradicional da região.
          Torresmo de rolo crocante, frango assado no ponto e cortes especiais!
        </p>
      </section>

      {/* GALERIA DE FOTOS */}
      <section className="p-6" id="cardapio">
        <h2 className="text-3xl font-bold mb-4 text-center">🍗 Nossos Assados</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {fotos.map((img, i) => (
            <div key={i} className="rounded-lg overflow-hidden shadow">
              <Image src={img} alt="Foto" width={500} height={400} className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="p-6 text-center bg-white shadow-inner">
        <h2 className="text-2xl font-bold mb-2">📞 Contato</h2>

        <p className="text-lg">
          WhatsApp: <a href="https://wa.me/5511948163211" className="text-green-600 font-bold">11 94816-3211</a>
        </p>

        <p className="mt-3">📍 Av. Sapopemba, 16015 — São Paulo, SP</p>
              <a
        href="https://maps.app.goo.gl/L6T84Y9qR8eXA8"
        className="text-blue-600 underline"
      >
        ➜ Abrir no Google Maps
      </a>
    </section>

    {/* RODAPÉ */}
    <footer className="bg-yellow-500 text-center py-4 mt-10 shadow-inner">
      <p className="font-semibold text-[#2a2a2a]">
        © 2025 Gigante dos Assados — Todos os direitos reservados.
      </p>

      <a
        href="https://wa.me/5511948163211"
        className="fixed bottom-6 right-6 bg-green-600 text-white font-bold px-6 py-3 rounded-full shadow-lg neon"
      >
        FAÇA SEU PEDIDO
      </a>
    </footer>
  </main>
);
}
