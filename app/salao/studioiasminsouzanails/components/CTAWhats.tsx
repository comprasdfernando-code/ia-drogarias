export default function CTAWhats() {
  return (
    <section className="px-6 pb-24 pt-10">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-[#d4af37]/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.04))] p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.30)] backdrop-blur-sm md:p-12">
        <p className="text-xs tracking-[0.45em] text-[#d4af37]">AGENDE AGORA</p>

        <h3 className="mt-4 text-2xl font-light text-white md:text-4xl">
          Seu horário com elegância e exclusividade
        </h3>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
          Atendimento com hora marcada, cuidado nos detalhes e uma experiência
          feita para valorizar sua autoestima.
        </p>

        <a
          href="https://wa.me/5511946828073?text=Olá%2C%20quero%20agendar%20um%20horário"
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-block rounded-full bg-[linear-gradient(135deg,#f3d57a_0%,#d4af37_45%,#b8871f_100%)] px-8 py-4 text-base font-semibold text-black shadow-[0_10px_30px_rgba(212,175,55,0.25)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(212,175,55,0.35)]"
        >
          Falar no WhatsApp
        </a>
      </div>
    </section>
  );
}