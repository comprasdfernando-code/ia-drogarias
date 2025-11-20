// app/turismo/mundoverdetour/components/Hero.tsx
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-lime-500 text-white">
      <div className="absolute inset-0 opacity-15 bg-[url('https://images.pexels.com/photos/5726883/pexels-photo-5726883.jpeg?auto=compress&cs=tinysrgb&w=1200')] bg-cover bg-center" />
      <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 space-y-6">
          <p className="uppercase tracking-[0.3em] text-sm md:text-xs text-lime-200">
            Mundo Verde Tour • Monte Verde - MG
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            Descubra o encanto de{" "}
            <span className="text-lime-300">Monte Verde</span>
          </h1>
          <p className="text-base md:text-lg text-green-50 max-w-xl">
            Respire o ar puro da serra, sinta o friozinho gostoso e viva
            experiências inesquecíveis na{" "}
            <span className="font-semibold">Suíça Mineira</span> com quem
            conhece cada cantinho de Monte Verde.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="#servicos"
              className="px-6 py-3 rounded-full bg-white text-green-800 font-semibold shadow-md hover:bg-lime-50 transition"
            >
              Ver passeios & serviços
            </a>
            <a
              href="#contato"
              className="px-6 py-3 rounded-full border border-lime-200/70 text-white font-semibold hover:bg-white/10 transition"
            >
              Falar com um especialista
            </a>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-green-50/90 pt-2">
            <div>
              🌲 <span className="font-semibold">Paisagens deslumbrantes</span>
            </div>
            <div>
              🍷 <span className="font-semibold">Gastronomia irresistível</span>
            </div>
            <div>
              💚 <span className="font-semibold">Clima romântico</span>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-4 shadow-2xl max-w-md ml-auto">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4">
              <img
                src="https://images.pexels.com/photos/5726889/pexels-photo-5726889.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Centro de Monte Verde à noite"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-green-50">
              Passeios personalizados, city tour, experiências românticas e
              transporte com conforto e segurança.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}