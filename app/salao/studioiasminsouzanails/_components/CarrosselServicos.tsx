"use client";

import { useEffect, useMemo, useState } from "react";

type Slide = {
  titulo: string;
  subtitulo: string;
  descricao: string;
};

const slides = [
  {
    titulo: "Alongamento Molde F1",
    subtitulo: "Estrutura elegante e acabamento marcante",
    descricao:
      "Ideal para quem deseja unhas sofisticadas, resistentes e com visual impecável no dia a dia.",
  },
  {
    titulo: "Banho de Gel",
    subtitulo: "Brilho, proteção e naturalidade",
    descricao:
      "Perfeito para fortalecer as unhas naturais, aumentar a durabilidade e manter um acabamento delicado e refinado.",
  },
  {
    titulo: "Esmaltação em Gel",
    subtitulo: "Durabilidade com beleza premium",
    descricao:
      "Mais brilho, mais resistência e unhas lindas por muito mais tempo, com acabamento elegante.",
  },
  {
    titulo: "Decoração Personalizada",
    subtitulo: "Simples, média ou avançada",
    descricao:
      "Detalhes que valorizam ainda mais o resultado final, deixando o atendimento com a sua identidade.",
  },
];

export default function CarrosselServicos() {
  const [current, setCurrent] = useState(0);

  const total = useMemo(() => slides.length, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 4500);

    return () => clearInterval(timer);
  }, [total]);

  const goPrev = () => {
    setCurrent((prev) => (prev - 1 + total) % total);
  };

  const goNext = () => {
    setCurrent((prev) => (prev + 1) % total);
  };

  return (
    <section className="relative px-6 pb-8 pt-4 md:pb-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <p className="text-xs tracking-[0.45em] text-[#d4af37]">
            DESTAQUES
          </p>
          <h2 className="mt-3 text-3xl font-light text-white md:text-4xl">
            Conheça alguns dos serviços
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
            Um atendimento pensado para unir beleza, sofisticação e acabamento
            premium em cada detalhe.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15),transparent_30%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_25%)]" />

          <div className="relative min-h-[320px] px-6 py-10 md:min-h-[360px] md:px-10 md:py-14">
            <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
              <div>
                <span className="inline-flex rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-xs tracking-[0.3em] text-[#f1cc63]">
                  {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </span>

                <h3 className="mt-6 text-3xl font-light text-white md:text-5xl">
                  {slides[current].titulo}
                </h3>

                <p className="mt-4 text-lg text-[#d4af37] md:text-xl">
                  {slides[current].subtitulo}
                </p>

                <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-300 md:text-base">
                  {slides[current].descricao}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="https://wa.me/5511946828073?text=Olá%2C%20quero%20agendar%20um%20horário"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[linear-gradient(135deg,#f3d57a_0%,#d4af37_45%,#b8871f_100%)] px-6 py-3 text-sm font-semibold text-black transition duration-300 hover:-translate-y-1"
                  >
                    Agendar agora
                  </a>

                  <a
                    href="#servicos"
                    className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition duration-300 hover:border-[#d4af37]/40 hover:bg-white/10"
                  >
                    Ver valores
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative flex h-[220px] w-full max-w-[320px] items-center justify-center rounded-[28px] border border-[#d4af37]/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.16),rgba(255,255,255,0.04))] p-8 shadow-[0_10px_40px_rgba(212,175,55,0.08)]">
                  <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle,rgba(212,175,55,0.14),transparent_65%)]" />
                  <div className="relative text-center">
                    <p className="text-xs tracking-[0.45em] text-[#d4af37]">
                      STUDIO PREMIUM
                    </p>
                    <p className="mt-5 text-2xl font-light text-white md:text-3xl">
                      {slides[current].titulo}
                    </p>
                    <div className="mx-auto mt-6 h-px w-20 bg-[#d4af37]/40" />
                    <p className="mt-6 text-sm text-zinc-300">
                      Beleza, cuidado e sofisticação em cada atendimento.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={goPrev}
            aria-label="Slide anterior"
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/40 px-4 py-3 text-white transition hover:border-[#d4af37]/40 hover:bg-black/60"
          >
            ←
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Próximo slide"
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/40 px-4 py-3 text-white transition hover:border-[#d4af37]/40 hover:bg-black/60"
          >
            →
          </button>

          <div className="relative z-10 flex items-center justify-center gap-3 pb-6">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Ir para slide ${index + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === current
                    ? "w-10 bg-[#d4af37]"
                    : "w-2.5 bg-white/25 hover:bg-white/45"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}