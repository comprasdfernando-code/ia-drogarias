"use client";

import Image from "next/image";
import Link from "next/link";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

export default function GigantePage() {
  return (
    <main className={poppins.className + " bg-gray-100 min-h-screen relative"}>

      {/* ======================
          CABEÇALHO MODERNO
      ======================= */}
      <header className="fixed top-0 left-0 w-full bg-red-700 shadow-lg z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/gigante-logo.png"
              alt="Gigante"
              width={55}
              height={55}
              className="rounded"
            />
            <h1 className="text-white text-xl font-bold tracking-wide">
              Gigante dos Assados
            </h1>
          </div>

          <nav className="hidden md:flex gap-4">
            <Link
              href="/gigante/pdv"
              className="text-white font-semibold hover:text-gray-200 transition"
            >
              PDV
            </Link>
            <Link
              href="/gigante/produtos"
              className="text-white font-semibold hover:text-gray-200 transition"
            >
              Produtos
            </Link>
            <Link
              href="/gigante/caixa"
              className="text-white font-semibold hover:text-gray-200 transition"
            >
              Caixa
            </Link>
          </nav>
        </div>
      </header>

      <div className="h-20" />

      {/* ======================
          HERO / TÍTULO
      ======================= */}
      <section className="text-center py-8">
        <h2 className="text-3xl font-bold text-red-800">Gigante dos Assados</h2>
        <p className="text-gray-600 mt-1">Grande no sabor 🍗</p>
      </section>

      {/* ======================
          CARDS / PROMOÇÕES
      ======================= */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-6 pb-10">

        <div className="bg-white rounded-xl shadow-md p-4">
          <Image
            src="/promo1.jpeg"
            alt="Promo 1"
            width={600}
            height={400}
            className="rounded-lg"
          />
          <h3 className="font-semibold text-lg mt-2 text-center">
            Frango Assado — R$ 49,90
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <Image
            src="/promo2.jpeg"
            alt="Promo 2"
            width={600}
            height={400}
            className="rounded-lg"
          />
          <h3 className="font-semibold text-lg mt-2 text-center">
            Combo Família — R$ 79,90
          </h3>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <Image
            src="/promo3.jpeg"
            alt="Promo 3"
            width={600}
            height={400}
            className="rounded-lg"
          />
          <h3 className="font-semibold text-lg mt-2 text-center">
            Costela no Bafo — R$ 49,90
          </h3>
        </div>

      </section>

      {/* ======================
          VÍDEO
      ======================= */}
      <section className="max-w-3xl mx-auto pb-24 px-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <video
            src="https://SEU-LINK-DO-SUPABASE.mp4"
            controls
            className="w-full rounded-xl"
          />
        </div>
        <p className="text-center mt-3 font-semibold text-red-700">
          🍗 Propaganda Oficial — Gigante dos Assados
        </p>
      </section>

      {/* ======================
          BOTÃO FLUTUANTE
          IGUAL MUNDOVERDETOUR
          MAS COM FRANGO 🍗🔥
      ======================= */}
      <Link
        href="https://wa.me/5511948163211?text=Olá!%20Quero%20fazer%20um%20pedido%20🍗🔥"
        target="_blank"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full shadow-xl transition-transform hover:scale-110 active:scale-95"
        style={{ fontWeight: "bold" }}
      >
        <Image
          src="/frango-icon.png"
          alt="Pedir"
          width={35}
          height={35}
          className="animate-pulse"
        />
        Faça seu Pedido
      </Link>

    </main>
  );
}