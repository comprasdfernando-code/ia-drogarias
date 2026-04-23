"use client";

const reels = [
  "https://www.instagram.com/reel/DXabm25k_lY/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
  "https://www.instagram.com/reel/DQ735NkjEcO/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
  "https://www.instagram.com/reel/DOHoPjdALWl/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
];

export default function ReelsIasmin() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-5xl mx-auto text-center">

        <p className="text-xs tracking-[0.4em] text-[#d4af37]">
          BASTIDORES
        </p>

        <h2 className="mt-3 text-3xl text-white md:text-4xl">
          O dia a dia do Studio 💅😂
        </h2>

        <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
          Além de unhas incríveis, aqui também tem leveza, risadas e um ambiente
          acolhedor. Vem conhecer um pouco mais 😄
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {reels.map((link, i) => (
            <a
              key={i}
              href={link}
              target="_blank"
              className="group relative rounded-2xl border border-white/10 bg-black/40 p-6 flex flex-col items-center justify-center gap-4 hover:border-[#d4af37]/40 transition hover:-translate-y-1"
            >
              <span className="text-3xl">🎬</span>

              <span className="text-sm text-white group-hover:text-[#d4af37] transition">
                Assistir no Instagram
              </span>

              <span className="text-xs text-zinc-500">
                Reel {i + 1}
              </span>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}