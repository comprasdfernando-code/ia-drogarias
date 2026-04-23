"use client";

import Image from "next/image";

const fotos = [
  "/studioiasminsouzanails/galeria/1.jpg",
  "/studioiasminsouzanails/galeria/2.jpg",
  "/studioiasminsouzanails/galeria/3.jpg",
];

const videos = [
  "https://www.instagram.com/reel/SEU_VIDEO_1/",
  "https://www.instagram.com/reel/SEU_VIDEO_2/",
];

export default function GaleriaReal() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-5xl mx-auto text-center">

        <p className="text-xs tracking-[0.4em] text-[#d4af37]">
          TRABALHOS REAIS
        </p>

        <h2 className="text-3xl text-white mt-3">
          Resultados do Studio
        </h2>

        {/* FOTOS */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10">
          {fotos.map((src, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl group"
            >
              <Image
                src={src}
                alt="Unhas feitas no studio"
                width={400}
                height={400}
                className="object-cover w-full h-full transition group-hover:scale-110"
              />
            </div>
          ))}
        </div>

        {/* VIDEOS */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {videos.map((link, i) => (
            <a
              key={i}
              href={link}
              target="_blank"
              className="rounded-full border border-[#d4af37]/30 px-6 py-3 text-sm text-white hover:bg-[#d4af37]/10 transition"
            >
              ▶ Ver vídeo no Instagram
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}