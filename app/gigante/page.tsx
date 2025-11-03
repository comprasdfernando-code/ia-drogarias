"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Link from "next/link";

export default function GigantePage() {
  return (
    <main
      style={{
        textAlign: "center",
        paddingTop: "100px", // dá espaço pro topo vermelho fixo
        backgroundColor: "#fff",
        minHeight: "100vh",
      }}
    >
      {/* 🔴 FAIXA VERMELHA NO TOPO */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "80px",
          backgroundColor: "#b91c1c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "30px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          zIndex: 1000,
        }}
      >
        <Link href="/gigante/pdv">
          <button
            style={{
              backgroundColor: "#fff",
              color: "#b91c1c",
              border: "none",
              padding: "10px 20px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 15,
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
              padding: "10px 20px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 15,
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
              padding: "10px 20px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 15,
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          >
            Caixa
          </button>
        </Link>
      </div>

      {/* LOGO E TÍTULO */}
      <img
        src="/gigante-logo.png"
        alt="Gigante dos Assados"
        style={{ width: 180, margin: "0 auto 10px" }}
      />
      <h1 style={{ color: "#b91c1c", marginBottom: 10 }}>Gigante dos Assados</h1>
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
              src="/promo1.jpg"
              alt="Promoção 1"
              style={{
                width: "100%",
                borderRadius: 10,
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            />
            <p style={{ marginTop: 10, fontWeight: "bold" }}>
              Frango Assado R$ 29,90
            </p>
          </SwiperSlide>

          <SwiperSlide>
            <img
              src="/promo2.jpg"
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
              src="/promo3.jpg"
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
    </main>
  );
}