"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Banner = {
  id: string;
  tag: string;
  titulo: string;
  destaque?: string;
  subtitulo: string;
  cta: string;
  href: string;
  bgImage?: string;
};

function safeBg(url?: string) {
  return url ? `url(${url})` : undefined;
}

export default function FVBanners() {
  const banners: Banner[] = useMemo(
    () => [
      {
        id: "genericos",
        tag: "PREÇO BAIXO TODO DIA",
        titulo: "Genéricos",
        destaque: "mais baratos",
        subtitulo: "Medicamentos de uso contínuo com economia de verdade.",
        cta: "Ver ofertas",
        href: "/fv",
        bgImage: "/fv/banners/genericos.jpg",
      },
      {
        id: "familia",
        tag: "FARMÁCIA ONLINE",
        titulo: "Sua saúde",
        destaque: "a um clique",
        subtitulo: "Higiene, infantil, vitaminas e medicamentos em um só lugar.",
        cta: "Comprar agora",
        href: "/fv",
        bgImage: "/fv/banners/verao.jpg",
      },
      {
        id: "seguranca",
        tag: "COMPRA SEGURA",
        titulo: "Peça pelo site",
        destaque: "com praticidade",
        subtitulo: "Atendimento, pagamento seguro e entrega conforme regra da loja.",
        cta: "Continuar comprando",
        href: "/fv",
        bgImage: "/fv/banners/vitaminas.jpg",
      },
    ],
    []
  );

  const [active, setActive] = useState(0);
  const [bgOverride, setBgOverride] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((old) => (old + 1) % banners.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  const banner = banners[active];

  function bgOf(b: Banner) {
    return bgOverride[b.id] || b.bgImage || "";
  }

  function handleImgError(b: Banner) {
    setBgOverride((prev) =>
      prev[b.id] ? prev : { ...prev, [b.id]: "/fv/banners/verao.jpg" }
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_18px_45px_rgba(13,71,161,0.12)]">
        <div
          className="relative h-[190px] transition-all duration-500 sm:h-[230px] md:h-[260px] lg:h-[280px]"
          style={{
            backgroundImage: safeBg(bgOf(banner)),
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <img
            src={bgOf(banner)}
            alt=""
            className="hidden"
            onError={() => handleImgError(banner)}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#0D47A1]/95 via-[#0D47A1]/78 to-[#0D47A1]/10" />

          <div className="absolute inset-0 flex items-center px-5 sm:px-8 md:px-10">
            <div className="max-w-[650px]">
              <span className="inline-flex rounded-full bg-[#FFD400] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#0D47A1] shadow">
                {banner.tag}
              </span>

              <h2 className="mt-3 text-3xl font-black leading-[0.95] tracking-tight text-white sm:text-4xl md:text-5xl">
                {banner.titulo}
                {banner.destaque && (
                  <span className="block text-[#FFD400]">
                    {banner.destaque}
                  </span>
                )}
              </h2>

              <p className="mt-3 max-w-[520px] text-sm font-medium text-white/90 sm:text-base">
                {banner.subtitulo}
              </p>

              <Link
                href={banner.href}
                className="mt-4 inline-flex rounded-2xl bg-[#E30613] px-5 py-3 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] hover:brightness-95"
              >
                {banner.cta} →
              </Link>
            </div>
          </div>

          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all ${
                  active === i
                    ? "w-8 bg-[#FFD400]"
                    : "w-2 bg-white/60 hover:bg-white"
                }`}
                aria-label={`Abrir banner ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}