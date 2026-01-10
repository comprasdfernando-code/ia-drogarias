"use client";

import { useMemo, useState } from "react";
import Slider from "react-slick";
import Link from "next/link";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

type Banner = {
  id: string;
  tag?: string;
  titulo: string;
  subtitulo?: string;
  cta1?: { label: string; href: string };
  cta2?: { label: string; href: string };
  bgImage?: string; // /public/...
};

function safeBg(url?: string) {
  return url ? `url(${url})` : undefined;
}

export default function FVBanners() {
  // ✅ Coloque os caminhos reais existentes dentro de /public/fv/banners/
  const banners: Banner[] = useMemo(
    () => [
      {
        id: "verao",
        tag: "OFERTAS",
        titulo: "Verão em Família",
        subtitulo: "Protetores, repelentes e cuidados diários",
        cta1: { label: "Ver ofertas", href: "/fv" },
        cta2: { label: "Continuar comprando", href: "/fv" },
        bgImage: "/fv/banners/verao.jpg",
      },
      {
        id: "dor",
        tag: "RÁPIDO",
        titulo: "Dor e Febre",
        subtitulo: "Analgésicos e antitérmicos",
        cta1: { label: "Ver ofertas", href: "/fv" },
        cta2: { label: "Continuar comprando", href: "/fv" },
        // ✅ se esse arquivo não existir, o fallback entra automaticamente
        bgImage: "/fv/banners/dor-febre.jpg",
      },
      {
        id: "vitaminas",
        tag: "DESTAQUE",
        titulo: "Vitaminas e Imunidade",
        subtitulo: "Energia e proteção para o dia a dia",
        cta1: { label: "Ver ofertas", href: "/fv" },
        cta2: { label: "Continuar comprando", href: "/fv" },
        bgImage: "/fv/banners/vitaminas.jpg",
      },
    ],
    []
  );

  // ✅ Fallback por banner (se der 404, troca pro verao.jpg por exemplo)
  const [bgOverride, setBgOverride] = useState<Record<string, string>>({});

  function bgOf(b: Banner) {
    return bgOverride[b.id] || b.bgImage || "";
  }

  function handleImgError(b: Banner) {
    // 1º fallback: verao.jpg
    // 2º fallback: vitaminas.jpg (se quiser)
    const fallback1 = "/fv/banners/verao.jpg";
    setBgOverride((prev) => (prev[b.id] ? prev : { ...prev, [b.id]: fallback1 }));
  }

  const settings = {
    dots: true,
    arrows: false,
    infinite: true,
    speed: 450,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4500,
    pauseOnHover: true,
    pauseOnFocus: true,
    swipeToSlide: true,
    adaptiveHeight: false,
  } as const;

  return (
    <section className="max-w-6xl mx-auto px-4">
      <div className="bg-white border rounded-3xl shadow-sm overflow-hidden">
        <Slider {...settings}>
          {banners.map((b) => (
            <div key={b.id}>
              <div
                className="relative h-[220px] sm:h-[270px] md:h-[320px]"
                style={{
                  backgroundImage: safeBg(bgOf(b)),
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* ✅ “preload invisível” pra capturar 404 e aplicar fallback */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bgOf(b)}
                  alt=""
                  className="hidden"
                  onError={() => handleImgError(b)}
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

                <div className="absolute inset-0 p-5 sm:p-6 md:p-8 flex flex-col justify-end">
                  {b.tag ? (
                    <span className="inline-flex w-fit mb-2 text-[11px] font-extrabold bg-white/20 text-white px-3 py-1 rounded-full">
                      {b.tag}
                    </span>
                  ) : null}

                  <div className="text-white text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
                    {b.titulo}
                  </div>

                  {b.subtitulo ? (
                    <div className="text-white/90 mt-2 text-sm sm:text-base">
                      {b.subtitulo}
                    </div>
                  ) : null}

                  {/* ✅ Mobile: botões ficam mais compactos e cabem melhor */}
                  <div className="mt-4 flex gap-2 sm:gap-3 flex-wrap">
                    {b.cta1 ? (
                      <Link
                        href={b.cta1.href}
                        className="bg-green-500 hover:bg-green-600 text-white font-extrabold px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-sm sm:text-base"
                      >
                        {b.cta1.label}
                      </Link>
                    ) : null}

                    {b.cta2 ? (
                      <Link
                        href={b.cta2.href}
                        className="bg-white/15 hover:bg-white/20 text-white font-extrabold px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl border border-white/20 text-sm sm:text-base"
                      >
                        {b.cta2.label}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>

        {/* ✅ Ajuste visual dos dots do slick (sem precisar CSS global) */}
        <style jsx global>{`
          .slick-dots {
            bottom: 10px;
          }
          .slick-dots li button:before {
            font-size: 10px;
            opacity: 0.35;
          }
          .slick-dots li.slick-active button:before {
            opacity: 0.9;
          }
        `}</style>
      </div>
    </section>
  );
}
