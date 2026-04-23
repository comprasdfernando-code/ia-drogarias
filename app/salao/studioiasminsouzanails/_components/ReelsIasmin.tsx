"use client";

import Image from "next/image";

const reels = [
  {
    titulo: "Bastidores do atendimento",
    link: "https://www.instagram.com/reel/DXabm25k_lY/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
    capa: "/studioiasminsouzanails/reels/reel1.jpg",
  },
  {
    titulo: "Vídeo divertido do studio",
    link: "https://www.instagram.com/reel/DQ735NkjEcO/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
    capa: "/studioiasminsouzanails/reels/reel2.jpg",
  },
  {
    titulo: "Mais um momento real",
    link: "https://www.instagram.com/reel/DOHoPjdALWl/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
    capa: "/studioiasminsouzanails/reels/reel3.jpg",
  },
];

export default function ReelsIasmin() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-xs tracking-[0.4em] text-[#d4af37]">BASTIDORES</p>

        <h2 className="mt-3 text-3xl text-white md:text-4xl">
          O dia a dia do Studio 💅 😂
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-zinc-400">
          Além de unhas incríveis, aqui também tem leveza, risadas e um ambiente
          acolhedor. Vem conhecer um pouco mais 😄
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reels.map((reel, i) => (
            <a
              key={i}
              href={reel.link}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-2xl border border-white/10 bg-black/40 text-left transition hover:-translate-y-1 hover:border-[#d4af37]/40"
            >
              <div className="relative aspect-[9/16] w-full overflow-hidden">
                <Image
                  src={reel.capa}
                  alt={reel.titulo}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-black/45 backdrop-blur-sm transition group-hover:scale-110 group-hover:border-[#d4af37]/50">
                    <span className="ml-1 text-2xl text-white">▶</span>
                  </div>
                </div>

                <div className="absolute left-4 top-4 rounded-full border border-[#d4af37]/30 bg-black/50 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-[#d4af37] backdrop-blur-sm">
                  Reel
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm font-medium text-white transition group-hover:text-[#d4af37]">
                  {reel.titulo}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Toque para assistir no Instagram
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}