"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Link from "next/link";

export default function GigantePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main
      style={{
        textAlign: "center",
        paddingTop: "100px",
        backgroundColor: "#fff",
        minHeight: "100vh",
      }}
    >
      {/* 🔴 TOPO FIXO RESPONSIVO */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "80px",
          backgroundColor: "#b91c1c",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          zIndex: 1000,
        }}
      >
        {/* 🏷️ LOGO À ESQUERDA */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src="/gigante-logo.png"
            alt="Gigante dos Assados"
            style={{ height: 45 }}
          />
          <h2 style={{ color: "#fff", fontWeight: "bold", fontSize: "1.2rem" }}>
            Gigante dos Assados
          </h2>
        </div>

        {/* 🍗 BOTÕES À DIREITA (desktop) */}
        <nav
          className="menu-desktop"
          style={{
            display: "flex",
            gap: "15px",
          }}
        >
          <Link href="/gigante/pdv">
            <button
              style={{
                backgroundColor: "#fff",
                color: "#b91c1c",
                border: "none",
                padding: "10px 18px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 14,
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              PDV
            </button>
          </Link>

          <Link href="/gigante/produtos">
            <button
              style={{
                backgroundColor: "#fff",
                color: "#b91c1c",
                border: "none",
                padding: "10px 18px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 14,
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              Produtos
            </button>
          </Link>

          <Link href="/gigante/caixa">
            <button
              style={{
                backgroundColor: "#fff",
                color: "#b91c1c",
                border: "none",
                padding: "10px 18px",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 14,
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              Caixa
            </button>
          </Link>
        </nav>

        {/* 🍔 BOTÃO MOBILE */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="menu-mobile-btn"
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "26px",
            display: "none",
          }}
        >
          ☰
        </button>
      </header>

      {/* MENU MOBILE (aparece quando abre) */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: 0,
            width: "100%",
            backgroundColor: "#b91c1c",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "10px 0",
            zIndex: 999,
            gap: "10px",
          }}
        >
          <Link href="/gigante/pdv">
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                backgroundColor: "#fff",
                color: "#b91c1c",
                border: "none",
                padding: "10px 60px",
                borderRadius: 6,
                fontWeight: "bold",
              }}
            >
              PDV
            </button>
          </Link>

          <Link href="/gigante/produtos">
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                backgroundColor: "#fff",
                color: "#b91c1c",
                border: "none",
                padding: "10px 60px",
                borderRadius: 6,
                fontWeight: "bold",
              }}
            >
              Produtos
            </button>
          </Link>

          <Link href="/gigante/caixa">
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                backgroundColor: "#fff",
                color: "#b91c1c",
                border: "none",
                padding: "10px 60px",
                borderRadius: 6,
                fontWeight: "bold",
              }}
            >
              Caixa
            </button>
          </Link>
        </div>
      )}

      {/* LOGO E FRASE */}
      <h1 style={{ color: "#b91c1c", marginBottom: 10, marginTop: 20 }}>
        Gigante dos Assados
      </h1>
      <p style={{ color: "#444", marginBottom: 25 }}>Grande no sabor 🍗</p>

      {/* 🧩 CARROSSEL DE PROMOÇÕES */}
      <div style={{ maxWidth: 800, margin: "0 auto 40px" }}>
        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 3000 }}
          pagination={{ clickable: true }}
          spaceBetween={20}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          <SwiperSlide>
            <img
              src="/promo1.jpeg"
              alt="Promoção 1"
              style={{
                width: "100%",
                borderRadius: 10,
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            />
            <p style={{ marginTop: 10, fontWeight: "bold" }}>
              Frango Assado R$ 49,90
            </p>
          </SwiperSlide>

          <SwiperSlide>
            <img
              src="/promo2.jpeg"
              alt="Promoção 2"
              style={{
                width: "100%",
                borderRadius: 10,
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            />
            <p style={{ marginTop: 10, fontWeight: "bold" }}>
              Combo Família R$ 79,90
            </p>
          </SwiperSlide>

          <SwiperSlide>
            <img
              src="/promo3.jpeg"
              alt="Promoção 3"
              style={{
                width: "100%",
                borderRadius: 10,
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            />
            <p style={{ marginTop: 10, fontWeight: "bold" }}>
              Costela no Bafo R$ 49,90
            </p>
          </SwiperSlide>
        </Swiper>
      </div>

      {/* 🎥 VÍDEO DE PROPAGANDA */}
<div
  style={{
    maxWidth: "600px",        // 🔹 Largura máxima (ajusta aqui se quiser menor ou maior)
    margin: "30px auto",      // 🔹 Centraliza horizontalmente
    textAlign: "center",
  }}
>
  <video
    src="/video1.mp4"
    controls
    autoPlay
    muted
    loop
    style={{
      width: "100%",
      height: "auto",
      borderRadius: "10px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    }}
  />

  <p
    style={{
      marginTop: 10,
      fontWeight: "bold",
      color: "#b91c1c",
      fontSize: "14px",
    }}
  >
    🍗 Propaganda Oficial - Gigante dos Assados
  </p>
</div>

      {/* CSS RESPONSIVO INLINE */}
      <style>{`
        @media (max-width: 768px) {
          .menu-desktop {
            display: none !important;
          }
          .menu-mobile-btn {
            display: block !important;
          }
        }
      `}</style>
    </main>
  );
}