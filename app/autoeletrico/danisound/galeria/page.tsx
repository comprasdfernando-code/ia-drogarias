import Image from "next/image";

export default function GaleriaDaniSound() {
  const fotos = [
    "loja-dia.jpg",
    "loja-noite.jpg",
    "antes-honda.jpg",
    "depois-honda.jpg",
    "antes-kia.jpg",
    "depois-kia.jpg",
    "antes-led.jpg",
    "depois-led.jpg",
    "falante-hurricane.jpg",
    "led-s14.jpg",
    "alarme.jpg",
    "antena-lookout.jpg",
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-16 text-white">

      {/* TÍTULO */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold neon-red">Galeria de Trabalhos</h1>
        <p className="text-zinc-300 max-w-2xl mx-auto text-sm">
          Fotos reais do dia a dia do Dani Sound: instalações, elétrica,
          multimídia, LED, acabamento e muito mais.
        </p>
      </div>

      {/* GRID DE FOTOS */}
      <section
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
      >
        {fotos.map((foto, idx) => (
          <div
            key={idx}
            className="aspect-square relative overflow-hidden rounded-xl card-premium-dark hover:border-red-700/50 transition"
          >
            <Image
              src={`/danisound/${foto}`}
              alt={foto}
              fill
              className="object-cover img-neon"
            />
          </div>
        ))}
      </section>

      {/* CTA WHATSAPP */}
      <div className="text-center pt-10">
        <a
          href="https://wa.me/5511977844066?text=Olá,+quero+um+serviço+igual+das+fotos!"
          target="_blank"
          className="btn-neon px-8 py-4 text-lg rounded-full inline-block"
        >
          Pedir orçamento agora
        </a>
      </div>
    </div>
  );
}
