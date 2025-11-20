// app/turismo/mundoverdetour/components/Hero.tsx
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#7A8C43] text-white">
      {/* imagem de fundo suave */}
      <div
        className="absolute inset-0 opacity-30 bg-cover bg-center"
        style={{
          backgroundImage: "url('/mundoverdetour/hero-centro-noite.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 space-y-5">
          <p className="uppercase tracking-[0.28em] text-xs md:text-[11px] text-lime-200">
            Mundo Verde Tour • Monte Verde - MG
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            Venha viver{" "}
            <span className="text-lime-200">experiências únicas</span> na
            Suíça Mineira
          </h1>
          <p className="text-sm md:text-lg text-green-50/90 max-w-xl">
            Descubra o charme de Monte Verde com quem conhece cada detalhe:
            passeios personalizados, city tour completo e transporte com
            conforto e segurança.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="#servicos"
              className="px-6 py-3 rounded-full bg-white text-[#35603b] font-semibold shadow-md hover:bg-lime-50 transition"
            >
              Ver passeios e serviços
            </a>
            <a
              href="#contato"
              className="px-6 py-3 rounded-full border border-lime-100 text-white font-semibold hover:bg-white/10 transition"
            >
              Falar com a equipe
            </a>
          </div>

          <div className="flex flex-wrap gap-5 text-xs md:text-sm text-lime-100 pt-2">
            <span>🌲 Paisagens deslumbrantes</span>
            <span>🍷 Gastronomia irresistível</span>
            <span>💚 Clima romântico</span>
          </div>
        </div>

        <div className="flex-1 max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-lime-100">
            <img
              src="/mundoverdetour/descubra-monte-verde-card.jpg"
              alt="Card Descubra Monte Verde"
              className="w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}