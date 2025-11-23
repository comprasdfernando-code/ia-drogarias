import Image from "next/image";

export default function AntesDepois() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-20">

      {/* TÍTULO */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold">Antes & Depois</h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-sm">
          Transformações reais feitas no Dani Sound. Instalações profissionais, 
          acabamento impecável e um novo visual para o seu carro.
        </p>
      </div>

      {/* LISTA DE PROJETOS */}
      <section className="space-y-20">

        {/* ================= HONDA ================= */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">Honda Fit — Multimídia Premium</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-zinc-400 mb-2">Antes</p>
              <div className="relative w-full h-80 rounded-xl overflow-hidden border border-zinc-800">
                <Image
                  src="/danisound/antes-honda.jpg"
                  alt="Honda antes"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-zinc-400 mb-2">Depois</p>
              <div className="relative w-full h-80 rounded-xl overflow-hidden border border-red-700/60 shadow-lg shadow-red-900/40">
                <Image
                  src="/danisound/depois-honda.jpg"
                  alt="Honda depois"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= KIA ================= */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">Kia — Tela Grande Estilo Tesla</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-zinc-400 mb-2">Antes</p>
              <div className="relative w-full h-80 rounded-xl overflow-hidden border border-zinc-800">
                <Image
                  src="/danisound/antes-kia.jpg"
                  alt="Kia antes"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-zinc-400 mb-2">Depois</p>
              <div className="relative w-full h-80 rounded-xl overflow-hidden border border-red-700/60 shadow-lg shadow-red-900/40">
                <Image
                  src="/danisound/depois-kia.jpg"
                  alt="Kia depois"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= LED ================= */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">LED Super Branca — Conversão</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-zinc-400 mb-2">Antes</p>
              <div className="relative w-full h-80 rounded-xl overflow-hidden border border-zinc-800">
                <Image
                  src="/danisound/antes-led.jpg"
                  alt="Farol antes"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-zinc-400 mb-2">Depois</p>
              <div className="relative w-full h-80 rounded-xl overflow-hidden border border-red-700/60 shadow-lg shadow-red-900/40">
                <Image
                  src="/danisound/depois-led.jpg"
                  alt="Farol depois"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* BOTÃO WHATSAPP */}
      <div className="text-center pt-10">
        <a
          href="https://wa.me/5511977844066?text=Olá,+quero+fazer+um+serviço+igual+a+este!"
          target="_blank"
          className="inline-block bg-red-600 hover:bg-red-700 px-8 py-4 text-lg rounded-full shadow-lg shadow-red-800/40"
        >
          Fazer um orçamento agora
        </a>
      </div>
    </div>
  );
}
