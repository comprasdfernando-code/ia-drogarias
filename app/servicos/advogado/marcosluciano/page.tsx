"use client";

import Image from "next/image";
import Link from "next/link";

export default function AdvogadoMarcosPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-10">
        
        {/* FOTO – LEFT */}
        <div className="w-full md:w-1/2 flex justify-center">
          <Image
            src="/drmarcos-premium.png"  // <- Substitua pelo nome da imagem
            width={500}
            height={600}
            alt="Dr. Marcos Luciano"
            className="rounded-lg shadow-xl object-cover"
          />
        </div>

        {/* TEXTO – RIGHT */}
        <div className="w-full md:w-1/2">
          <h1 className="text-4xl font-bold mb-3">Dr. Marcos Luciano</h1>
          <h2 className="text-xl text-gray-300 mb-6">
            Advogado Especialista em Direito Civil, Consumidor e Família
          </h2>

          <p className="text-gray-400 leading-relaxed mb-6">
            Atuação moderna e eficiente. Atendimento humanizado, análise completa do caso 
            e estratégias jurídicas claras para resolver seu problema de forma rápida e segura.
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

      {/* ÁREAS DE ATUAÇÃO */}
      <section className="bg-[#111522] py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center mb-10">Áreas de Atuação</h3>

          <div className="grid md:grid-cols-2 gap-10 text-gray-300">

            <div>
              <h4 className="text-xl font-semibold text-white">📌 Direito do Consumidor</h4>
              <p className="mt-2">Cobranças indevidas, golpes bancários, compras online, reembolsos e cancelamentos.</p>
            </div>

            <div>
              <h4 className="text-xl font-semibold text-white">📌 Direito de Família</h4>
              <p className="mt-2">Divórcio, pensão alimentícia, guarda, visitas e dissolução de união estável.</p>
            </div>

            <div>
              <h4 className="text-xl font-semibold text-white">📌 Direito Civil</h4>
              <p className="mt-2">Contratos, inventário, usucapião, dívidas e ações de indenização.</p>
            </div>

            <div>
              <h4 className="text-xl font-semibold text-white">📌 Direito Trabalhista</h4>
              <p className="mt-2">Rescisão, verbas não pagas, adicional, horas extras e assédio moral.</p>
            </div>

          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h3 className="text-3xl font-bold text-center mb-6">Sobre o Advogado</h3>
        <p className="text-gray-300 text-center leading-relaxed text-lg">
          O Dr. Marcos Luciano atua de forma estratégica, objetiva e moderna.  
          Cada caso é analisado com profundidade e clareza, com foco na solução mais rápida, segura e eficiente.  
          Atendimento personalizado e comprometimento total com o cliente.
        </p>
      </section>

      {/* CHAMADA FINAL */}
      <section className="bg-[#0D121F] py-16 text-center">
        <h3 className="text-3xl font-bold mb-4">Precisa de orientação jurídica?</h3>
        <p className="text-gray-300 mb-8 text-lg">
          Clique abaixo e fale diretamente com o advogado.
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
