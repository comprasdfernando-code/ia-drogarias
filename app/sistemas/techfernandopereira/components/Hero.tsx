import Image from "next/image";

export default function Hero() {
  return (
    <section className="w-full py-28 px-6 bg-[#05070A] relative overflow-hidden">

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/10 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto flex flex-col items-center text-center">
        
        {/* LOGO */}
        <Image
          src="/tech-fernando-pereira.png"
          alt="Tech Fernando Pereira"
          width={280}
          height={280}
          className="opacity-95 drop-shadow-[0_0_20px_rgba(30,144,255,0.3)]"
        />

        {/* TITLE */}
        <h1 className="text-4xl md:text-6xl font-extrabold mt-8 leading-tight">
          Tech Fernando Pereira
        </h1>

        {/* SUBTITLE */}
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mt-4">
          Soluções digitais inteligentes para o seu negócio.
        </p>

        {/* CTA BUTTON */}
        <a
          href="https://wa.me/5511962197021?text=Olá!%20Quero%20um%20orçamento%20do%20site%20ou%20sistema."
          className="mt-10 inline-block px-10 py-4 bg-blue-600 hover:bg-blue-700 
                     rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg"
        >
          Solicitar Orçamento
        </a>
      </div>
    </section>
  );
}
