// app/autoeletrico/danisound/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function PageDaniSound() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">

      {/* HERO */}
      <section className="grid md:grid-cols-2 gap-10 items-center">

        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            <span className="text-red-500">Auto Elétrico</span> & Som Automotivo  
            <span className="block text-zinc-300 text-lg font-normal mt-1">
              Qualidade, acabamento e confiança.
            </span>
          </h1>

          <p className="text-zinc-400 text-sm max-w-md">
            Dani Sound é especializado em elétrica automotiva, som, multimídia, LED, alarmes,
            travas elétricas e muito mais. Trabalhos reais do dia a dia.
          </p>

          <div className="flex gap-3">
            <a
              href="https://wa.me/5511977844066?text=Olá,+quero+um+orçamento+para+meu+carro!"
              target="_blank"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm"
            >
              Pedir Orçamento
            </a>

            <Link
              href="/autoeletrico/danisound/servicos"
              className="border border-red-800 text-red-400 px-4 py-2 rounded-full text-sm hover:bg-red-900/30"
            >
              Ver Serviços
            </Link>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden h-64">
          <Image
            src="/danisound/card-servicos.jpg"
            alt="Serviços Dani Sound"
            fill
            className="object-cover"
          />
        </div>

      </section>

      {/* SEÇÃO RÁPIDA DE SERVIÇOS */}
      <section className="space-y-6">

        <h2 className="text-2xl font-semibold">Principais serviços</h2>

        <ul className="text-sm text-zinc-300 space-y-1">
          <li>✔️ Bloqueador, Alarme</li>
          <li>✔️ Vidro Elétrico, Trava Elétrica</li>
          <li>✔️ Multimídia, Super LEDs</li>
          <li>✔️ Insulfilm</li>
          <li>✔️ Caixa Bob</li>
          <li>✔️ Alternador</li>
          <li>✔️ Motor de Arranque</li>
        </ul>

      </section>

    </div>
  );
}
