"use client";

import Link from "next/link";

export default function AdvogadoMarcosPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* HERO */}
      <section className="w-full bg-gray-100 px-6 py-14 text-center border-b">
        <h1 className="text-3xl font-bold text-gray-900">
          Dr. Marcos Luciano – Advogado
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Especialista em Direito Civil, Consumidor e Família
        </p>

        <div className="mt-6">
          <Link
            href="https://wa.me/5511998362568"
            target="_blank"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium text-lg transition"
          >
            Falar no WhatsApp
          </Link>
        </div>
      </section>

      {/* ÁREAS DE ATUAÇÃO */}
      <section className="px-6 py-10 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 text-center">
          Áreas de Atuação
        </h2>

        <div className="space-y-6 text-gray-700">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              📌 Direito do Consumidor
            </h3>
            <p>
              Cobranças indevidas, golpes bancários, problemas com empresas,
              compras online, reembolsos e cancelamentos.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              📌 Direito de Família
            </h3>
            <p>
              Divórcio, pensão alimentícia, guarda, regulamentação de visitas e
              dissolução de união estável.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              📌 Direito Civil
            </h3>
            <p>
              Contratos, inventário, usucapião, dívidas e ações de indenização.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              📌 Direito Trabalhista
            </h3>
            <p>
              Rescisão, verbas não pagas, adicional, horas extras e assédio
              moral.
            </p>
          </div>
        </div>
      </section>

      {/* SOBRE O ADVOGADO */}
      <section className="px-6 py-10 bg-gray-50 border-y">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 text-center">
          Sobre o Advogado
        </h2>

        <p className="max-w-3xl mx-auto text-center text-gray-700 leading-relaxed">
          O Dr. Marcos Luciano é advogado atuante com experiência prática em
          resolução de conflitos e defesa jurídica preventiva. Seu atendimento é
          humanizado, claro e direto, com total transparência em todas as etapas
          do processo.
          <br />
          <br />
          Compromisso com agilidade, profissionalismo e ética.
        </p>
      </section>

      {/* CHAMADA FINAL */}
      <section className="px-6 py-14 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Precisa falar com um advogado agora?
        </h2>
        <p className="text-gray-600 mt-2">
          Atendimento online e presencial. Clique abaixo e fale diretamente com
          o Dr. Marcos.
        </p>

        <div className="mt-6">
          <Link
            href="https://wa.me/5511998362568"
            target="_blank"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium text-lg transition"
          >
            Falar com Dr. Marcos no WhatsApp
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-6 text-center text-sm text-gray-500 border-t">
        © {new Date().getFullYear()} – Página demonstrativa criada por Fernando.
      </footer>
    </div>
  );
}
