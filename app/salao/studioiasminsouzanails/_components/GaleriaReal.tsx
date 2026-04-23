"use client";

import Image from "next/image";

const fotos = [
  "/studioiasminsouzanails/galeria/1.jpg",
  "/studioiasminsouzanails/galeria/2.jpg",
  "/studioiasminsouzanails/galeria/3.jpg",
  "/studioiasminsouzanails/galeria/4.jpg",
  "/studioiasminsouzanails/galeria/5.jpg",
  "/studioiasminsouzanails/galeria/6.jpg",
];

const videos = [
  {
    titulo: "Alongamento em Gel",
    link: "https://www.instagram.com/reel/SEU_LINK_1/",
  },
  {
    titulo: "Decoração Avançada",
    link: "https://www.instagram.com/reel/SEU_LINK_2/",
  },
  {
    titulo: "Esmaltação em Gel",
    link: "https://www.instagram.com/reel/SEU_LINK_3/",
  },
];

export default function GaleriaReal() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl text-center">

        {/* TÍTULO */}
        <p className="text-xs tracking-[0.4em] text-[#d4af37]">
          TRABALHOS REAIS
        </p>

        <h2 className="mt-3 text-3xl text-white md:text-4xl">
          Resultados do Studio
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm text-zinc-400">
          Veja alguns dos resultados reais realizados no studio, com acabamento
          premium e atenção em cada detalhe.
        </p>

        {/* FOTOS */}
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
          {fotos.map((src, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-white/10"
            >
              <Image
                src={src}
                alt="Trabalho realizado no studio"
                width={500}
                height={500}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />

              {/* overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 transition group-hover:opacity-100" />

              {/* brilho */}
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(212,175,55,0.15),transparent_60%)] opacity-0 transition group-hover:opacity-100" />
            </div>
          ))}
        </div>

        {/* VIDEOS */}
        <div className="mt-14">
          <p className="text-xs tracking-[0.4em] text-[#d4af37]">
            VÍDEOS
          </p>

          <h3 className="mt-3 text-2xl text-white">
            Veja em ação no Instagram
          </h3>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {videos.map((video, i) => (
              <a
                key={i}
                href={video.link}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-full border border-[#d4af37]/30 bg-black/40 px-6 py-3 text-sm text-white backdrop-blur transition hover:-translate-y-1 hover:border-[#d4af37]/60"
              >
                <span className="text-[#d4af37]">▶</span>
                <span className="group-hover:text-[#d4af37] transition">
                  {video.titulo}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}