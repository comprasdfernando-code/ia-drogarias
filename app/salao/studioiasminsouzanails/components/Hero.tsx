"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-[#050505]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_35%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_25%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#050505_0%,#0b0b0b_45%,#050505_100%)]" />

      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-[#d4af37]/10 blur-3xl" />
      <div className="absolute left-1/2 top-40 h-44 w-44 -translate-x-1/2 rounded-full border border-[#d4af37]/15" />

      <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="animate-[floatLogo_4s_ease-in-out_infinite] mb-8">
          <div className="rounded-full border border-[#d4af37]/20 bg-white/5 p-4 shadow-[0_0_40px_rgba(212,175,55,0.10)] backdrop-blur-sm">
            <Image
              src="/studioiasminsouzanails/logo.png"
              alt="Iasmin Souza Nail Designer"
              width={220}
              height={220}
              className="h-auto w-[180px] object-contain md:w-[220px]"
              priority
            />
          </div>
        </div>

        <h1 className="animate-[fadeUp_0.9s_ease-out] text-4xl font-light tracking-[0.20em] text-white md:text-6xl">
          IASMIN SOUZA
        </h1>

        <div className="mt-4 flex items-center gap-4 animate-[fadeUp_1.1s_ease-out]">
          <span className="h-px w-12 bg-[#d4af37]/50 md:w-20" />
          <p className="text-xs tracking-[0.55em] text-[#d4af37] md:text-sm">
            NAIL DESIGNER
          </p>
          <span className="h-px w-12 bg-[#d4af37]/50 md:w-20" />
        </div>

        <p className="mt-8 max-w-2xl animate-[fadeUp_1.3s_ease-out] text-base leading-relaxed text-zinc-300 md:text-xl">
          Unhas impecáveis com elegância, sofisticação e acabamento perfeito.
        </p>

        <p className="mt-3 max-w-xl animate-[fadeUp_1.45s_ease-out] text-sm text-zinc-400 md:text-base">
          Atendimento com hora marcada para quem busca beleza, cuidado e uma
          experiência premium.
        </p>

        <div className="mt-10 flex flex-col gap-4 animate-[fadeUp_1.6s_ease-out] sm:flex-row">
          <a
            href="https://wa.me/5511946828073?text=Olá%2C%20vim%20pela%20página%20e%20quero%20agendar%20um%20horário"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[linear-gradient(135deg,#f3d57a_0%,#d4af37_45%,#b8871f_100%)] px-8 py-4 text-base font-semibold text-black shadow-[0_10px_30px_rgba(212,175,55,0.25)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(212,175,55,0.35)]"
          >
            Agendar pelo WhatsApp
          </a>

          <a
            href="#servicos"
            className="rounded-full border border-[#d4af37]/35 bg-white/5 px-8 py-4 text-base font-medium text-white backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/60 hover:bg-white/10"
          >
            Ver serviços
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes floatLogo {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fadeUp {
          0% {
            opacity: 0;
            transform: translateY(28px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}