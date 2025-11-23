"use client";

import Image from "next/image";
import Link from "next/link";

export default function AdvogadoMarcosPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">

      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-10">

        {/* FOTO LADO ESQUERDO */}
        <div className="w-full md:w-1/2 flex justify-center">
          <Image
            src="/drmarcos-hero.png"
            width={500}
            height={650}
            alt="Dr. Marcos Luciano"
            className="rounded-lg shadow-xl object-cover"
          />
        </div>

        {/* TEXTO DO HERO */}
        <div className="w-full md:w-1/2">
          <h1 className="text-4xl font-bold mb-3">Dr. Marcos Luciano</h1>
          <h2 className="text-xl text-gray-300 mb-6">
            Advogado Especialista em Direito Civil, Consumidor e Família
          </h2>

          <p className="text-gray-400 leading-relaxed mb-6">
            Atendimento humanizado, moderno e eficiente. Estratégias jurídicas
            claras e personalizadas para resolver o seu problema com segurança
            e rapidez.
          </p>

          <Link
            href="https://wa.me/5511998362568"
            target="_blank"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition"
          >
            Falar no WhatsApp
          </Link>
        </div>
      </section>

      {/* BANNER COM IMAGEM MÚLTIPLA */}
      <section className="relative bg-[#0B0F19] py-20">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="/drmarcos-multipla1.png"
            alt="Dr Marcos"
            fill
            className="object-cover"
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Compromisso com a Justiça</h2>
          <p className="text-gray-300 text-lg">
            Atuação ética, transparente e dedicada na defesa dos seus direitos.
          </p>
        </div>
      </section>

      {/* ÁREAS DE ATUAÇÃO */}
      <section className="bg-[#111522] py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center mb-10">
            Áreas de Atuação
          </h3>

          <div className="grid md:grid-cols-2 gap-10 text-gray-300">
            <div>
              <h4 className="text-xl font-semibold text-white">📌 Direito do Consumidor</h4>
              <p className="mt-2">Cobranças indevidas, golpes, compras online, reembolsos e cancelamentos.</p>
            </div>

            <div>
              <h4 className="text-xl font-semibold text-white">📌 Direito de Família</h4>
              <p className="mt-2">Divórcio, pensão, guarda, visitas e dissolução de união estável.</p>
            </div>

            <div>
              <h4 className="text-xl font-semibold text-white">📌 Direito Civil</h4>
              <p className="mt-2">Contratos, inventário, usucapião, dívidas e indenizações.</p>
            </div>

            <div>
              <h4 className="text-xl font-semibold text-white">📌 Direito Trabalhista</h4>
              <p className="mt-2">Rescisão, verbas, horas extras e assédio moral.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO NO ESCRITÓRIO */}
      <section className="bg-[#0D121F] py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">

          <Image
            src="/drmarcos-escritorio.png"
            alt="Dr Marcos Escritório"
            width={500}
            height={600}
            className="rounded-lg shadow-xl"
          />

          <div>
            <h3 className="text-3xl font-bold mb-4">Excelência no Atendimento</h3>
            <p className="text-gray-300 leading-relaxed">
              Cada caso é tratado com máxima atenção e cuidado. A atuação combina
              técnica jurídica, experiência prática e sensibilidade humana.
            </p>

            <p className="text-gray-300 leading-relaxed mt-4">
              O Dr. Marcos oferece acompanhamento completo, clareza em todas as
              etapas e foco total no resultado para o cliente.
            </p>
          </div>

        </div>
      </section>

      {/* CHAMADA FINAL */}
      <section className="bg-[#0B0F19] py-16 text-center">
        <h3 className="text-3xl font-bold mb-4">Precisa falar com um advogado?</h3>
        <p className="text-gray-300 mb-8 text-lg">
          Atendimento imediato via WhatsApp. Clique abaixo:
        </p>

        <Link
          href="https://wa.me/5511998362568"
          target="_blank"
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition"
        >
          Falar com Dr. Marcos no WhatsApp
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="py-6 text-center text-sm text-gray-500 border-t border-gray-700">
        © {new Date().getFullYear()} – Página criada por Fernando.
      </footer>
    </div>
  );
}
