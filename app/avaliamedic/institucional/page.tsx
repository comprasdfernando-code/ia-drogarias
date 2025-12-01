export const dynamic = "force-static";

import Image from "next/image";
import Link from "next/link";

export default function InstitucionalAvaliaMedic() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* HERO */}
      <section className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto p-10 md:p-20">

          <h1 className="text-4xl font-bold text-emerald-700 leading-tight">
            AvaliaMedic
          </h1>

          <p className="text-xl text-gray-600 mt-4 max-w-2xl">
            Plataforma inteligente para <strong className="text-emerald-700">avaliação clínica de prescrições hospitalares</strong>, reduzindo riscos, padronizando condutas e fortalecendo a segurança medicamentosa.
          </p>

          <div className="mt-8">
            <Link
              href="/avaliamedic"
              className="bg-emerald-700 text-white px-8 py-3 rounded-lg shadow hover:bg-emerald-800 transition"
            >
              Acessar Plataforma
            </Link>
          </div>
        </div>
      </section>

      {/* O QUE É */}
      <section className="max-w-6xl mx-auto p-10 md:p-20">
        <h2 className="text-3xl font-semibold text-emerald-700">
          O que é o AvaliaMedic?
        </h2>

        <p className="text-gray-700 mt-4 leading-relaxed max-w-3xl">
          O <strong>AvaliaMedic</strong> é uma solução de inteligência clínica desenvolvida
          para apoiar equipes de <strong>enfermagem</strong>, <strong>farmácia hospitalar</strong> e <strong>corpo médico</strong>
          na análise de prescrições. Ele utiliza IA avançada para identificar riscos,
          sugerir ajustes, orientar condutas e entregar mais segurança ao paciente.
        </p>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-white border-t border-b py-16">
        <div className="max-w-6xl mx-auto p-10">
          <h2 className="text-3xl font-semibold text-emerald-700">
            Como funciona?
          </h2>

          <div className="grid md:grid-cols-3 gap-10 mt-10">

            {/* PASSO 1 */}
            <div className="bg-gray-50 border rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-emerald-700">1. Envio da Prescrição</h3>
              <p className="text-gray-600 mt-2">
                A enfermagem fotografa ou envia o PDF da prescrição.
              </p>
            </div>

            {/* PASSO 2 */}
            <div className="bg-gray-50 border rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-emerald-700">2. Análise Inteligente</h3>
              <p className="text-gray-600 mt-2">
                A IA identifica medicamentos, doses, vias, risco clínico e inconsistências.
              </p>
            </div>

            {/* PASSO 3 */}
            <div className="bg-gray-50 border rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-emerald-700">3. Parecer Farmacêutico</h3>
              <p className="text-gray-600 mt-2">
                A farmácia clínica valida, orienta e libera passos seguros para a enfermagem.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="max-w-6xl mx-auto p-10 md:p-20">
        <h2 className="text-3xl font-semibold text-emerald-700">Benefícios</h2>

        <div className="grid md:grid-cols-2 gap-10 mt-10">
          <div className="bg-white border p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold text-emerald-700">✔ Redução de Erros</h3>
            <p className="text-gray-600 mt-2">
              Evita falhas comuns em dose, via, frequência e compatibilidades.
            </p>
          </div>

          <div className="bg-white border p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold text-emerald-700">✔ Apoio à Enfermagem</h3>
            <p className="text-gray-600 mt-2">
              Informações claras para preparo, diluição e administração.
            </p>
          </div>

          <div className="bg-white border p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold text-emerald-700">✔ Suporte ao Médico</h3>
            <p className="text-gray-600 mt-2">
              Sugestões inteligentes baseadas em protocolos clínicos.
            </p>
          </div>

          <div className="bg-white border p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold text-emerald-700">✔ Rastreabilidade</h3>
            <p className="text-gray-600 mt-2">
              Toda análise fica registrada para auditoria hospitalar.
            </p>
          </div>
        </div>
      </section>

      {/* ESPECIALIDADES */}
      <section className="bg-white border-t border-b py-20">
        <div className="max-w-6xl mx-auto p-10">
          <h2 className="text-3xl font-semibold text-emerald-700">
            Feito para ambientes críticos
          </h2>

          <p className="text-gray-600 mt-4 max-w-3xl">
            O AvaliaMedic foi projetado para setores que exigem precisão absoluta:
          </p>

          <ul className="mt-6 text-gray-700 space-y-2">
            <li>• UTI Adulto</li>
            <li>• UTI Neonatal</li>
            <li>• Obstetrícia</li>
            <li>• Pronto Atendimento</li>
            <li>• Internação</li>
            <li>• Pediatria</li>
          </ul>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-6xl mx-auto p-10 md:p-20 text-center">
        <h2 className="text-3xl font-bold text-emerald-700">
          AvaliaMedic — Segurança Medicamentosa Inteligente
        </h2>

        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
          Reduza riscos. Padronize condutas. Eleve a segurança do seu hospital.
        </p>

        <div className="mt-10">
          <Link
            href="/avaliamedic"
            className="bg-emerald-700 text-white px-10 py-4 rounded-xl text-lg font-medium shadow hover:bg-emerald-800 transition"
          >
            Acessar Plataforma
          </Link>
        </div>
      </section>
    </main>
  );
}
