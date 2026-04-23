export default function BannerIA() {
  return (
    <section className="px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-[#d4af37]/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.04))] p-6 text-center backdrop-blur shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
        
        <p className="text-xs tracking-[0.4em] text-[#d4af37]">
          PARCERIA
        </p>

        <h3 className="mt-3 text-xl text-white md:text-2xl">
          Precisa de medicamentos?
        </h3>

        <p className="mt-3 text-sm text-zinc-300">
          Acesse nossa farmácia online com ofertas e entrega prática.
        </p>

        <a
          href="https://iadrogarias.com.br/fv"
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-block rounded-full bg-[#d4af37] px-6 py-3 text-sm font-semibold text-black transition hover:scale-105"
        >
          Acessar Farmácia
        </a>
      </div>
    </section>
  );
}