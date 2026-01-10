"use client";

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
  // você pode usar imagem como background via CSS, aqui deixei simples:
  className?: string;
  bgImage?: string; // opcional
};

export default function FVBanners() {
  const banners: Banner[] = [
    {
      id: "verao",
      tag: "OFERTAS",
      titulo: "Verão em Família",
      subtitulo: "Protetores, repelentes e cuidados diários",
      cta1: { label: "Ver ofertas", href: "/fv" },
      cta2: { label: "Continuar comprando", href: "/fv" },
      bgImage: "/fv/banners/verao.jpg", // ajuste o caminho
    },
    {
      id: "dor",
      tag: "RÁPIDO",
      titulo: "Dor e Febre",
      subtitulo: "Analgésicos e antitérmicos",
      cta1: { label: "Ver ofertas", href: "/fv" },
      cta2: { label: "Continuar comprando", href: "/fv" },
      bgImage: "/fv/banners/dor-febre.jpg", // ajuste o caminho
    },
    {
      id: "vitaminas",
      tag: "DESTAQUE",
      titulo: "Vitaminas e Imunidade",
      subtitulo: "Energia e proteção para o dia a dia",
      cta1: { label: "Ver ofertas", href: "/fv" },
      cta2: { label: "Continuar comprando", href: "/fv" },
      bgImage: "/fv/banners/vitaminas.jpg", // ajuste o caminho
    },
  ];

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
  } as const;

  return (
    <section className="max-w-6xl mx-auto px-4">
      <div className="bg-white border rounded-3xl shadow-sm overflow-hidden">
        <Slider {...settings}>
          {banners.map((b) => (
            <div key={b.id}>
              <div
                className="relative h-[230px] sm:h-[270px] md:h-[320px]"
                style={{
                  backgroundImage: b.bgImage ? `url(${b.bgImage})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                  {b.tag ? (
                    <span className="inline-flex w-fit mb-2 text-[11px] font-extrabold bg-white/20 text-white px-3 py-1 rounded-full">
                      {b.tag}
                    </span>
                  ) : null}

                  <div className="text-white text-3xl md:text-5xl font-extrabold leading-tight">
                    {b.titulo}
                  </div>

                  {b.subtitulo ? (
                    <div className="text-white/90 mt-2 text-sm md:text-base">
                      {b.subtitulo}
                    </div>
                  ) : null}

                  <div className="mt-5 flex gap-3 flex-wrap">
                    {b.cta1 ? (
                      <Link
                        href={b.cta1.href}
                        className="bg-green-500 hover:bg-green-600 text-white font-extrabold px-6 py-3 rounded-2xl"
                      >
                        {b.cta1.label}
                      </Link>
                    ) : null}

                    {b.cta2 ? (
                      <Link
                        href={b.cta2.href}
                        className="bg-white/15 hover:bg-white/20 text-white font-extrabold px-6 py-3 rounded-2xl border border-white/20"
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
      </div>
    </section>
  );
}
