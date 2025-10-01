"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination, Autoplay } from "swiper/modules";
import Link from "next/link";

export default function Carrossel() {
  return (
    <div className="w-full max-w-5xl mx-auto my-6">
      <Swiper
        modules={[Pagination, Autoplay]}
        spaceBetween={30}
        slidesPerView={1}
        pagination={{ clickable: true }}
        autoplay={{ delay: 4000 }}
        loop={true}
        className="rounded-lg shadow-lg"
      >
        {/* Slide 1 - E-commerce */}
        <SwiperSlide>
          <Link href="/farmacia">
            <img
              src="/banners/ecommerce.png"
              alt="Ir para o E-commerce"
              className="w-full rounded-lg cursor-pointer"
            />
          </Link>
        </SwiperSlide>

        {/* Slide 2 - Serviços */}
        <SwiperSlide>
          <Link href="/servicos">
            <img
              src="/banners/servicos.png"
              alt="Conheça nossos serviços"
              className="w-full rounded-lg cursor-pointer"
            />
          </Link>
        </SwiperSlide>

        {/* Slide 3 - Cadastro de Farmacêuticos */}
        <SwiperSlide>
          <Link href="/cadastro-farmaceuticos">
            <img
              src="/banners/farmaceuticos.png"
              alt="Cadastre-se como farmacêutico"
              className="w-full rounded-lg cursor-pointer"
            />
          </Link>
        </SwiperSlide>
      </Swiper>
    </div>
  );
}