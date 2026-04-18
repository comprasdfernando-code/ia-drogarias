import Image from "next/image";

export default function Hero() {
  return (
    <section className="text-center py-20 px-4">

      {/* LOGO */}
      <div className="flex justify-center mb-6">
        <Image
          src="/studioiasminsouzanails/logo.png"
          alt="Iasmin Souza Nails"
          width={180}
          height={180}
          className="object-contain"
          priority
        />
      </div>

      {/* NOME */}
      <h1 className="text-3xl md:text-4xl font-semibold tracking-wide">
        IASMIN SOUZA
      </h1>

      <p className="text-sm tracking-[4px] text-gray-400 mt-2">
        NAIL DESIGNER
      </p>

      {/* FRASE */}
      <p className="mt-6 text-gray-300">
        Unhas impecáveis com elegância e perfeição 💅
      </p>

      {/* BOTÃO */}
      <a
        href="https://wa.me/5511946828073"
        target="_blank"
        className="mt-8 inline-block bg-yellow-500 text-black px-8 py-3 rounded-full font-semibold hover:scale-105 transition"
      >
        Agendar pelo WhatsApp
      </a>
    </section>
  );
}