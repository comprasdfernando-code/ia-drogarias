export const dynamic = "force-dynamic";

import Link from "next/link";

export default function AvaliaMedicDashboard() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <header className="mb-10 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-emerald-700">
          AvaliaMedic AI
        </h1>

        <Link
          href="/avaliamedic/login"
          className="font-medium text-emerald-700 hover:underline"
        >
          Sair
        </Link>
      </header>

      <section className="mb-10 rounded-xl border bg-black p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-emerald-400">
          Atendimento Inteligente + Avaliação Técnica
        </h2>
        <p className="mt-2 text-gray-300">
          Use o modo comercial para gerar resposta pronta a partir de prints do
          WhatsApp e do orçamento, ou use o modo técnico para avaliação
          farmacêutica detalhada da prescrição.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Link
          href="/avaliamedic/processar-print"
          className="block rounded-xl bg-emerald-700 p-6 text-white shadow transition hover:bg-emerald-800"
        >
          <h3 className="text-xl font-semibold">Modo Comercial IA</h3>
          <p className="mt-2 text-emerald-100">
            Envie print do cliente + print do orçamento e gere resposta pronta
            para WhatsApp.
          </p>
        </Link>

        <Link
          href="/avaliamedic/enviar"
          className="block rounded-xl border bg-white p-6 shadow transition hover:border-emerald-600 hover:shadow-lg"
        >
          <h3 className="text-xl font-semibold text-emerald-700">
            Avaliação Técnica
          </h3>
          <p className="mt-2 text-gray-600">
            Avalie prescrições com análise farmacêutica detalhada.
          </p>
        </Link>

        <Link
          href="/avaliamedic/relatorio"
          className="block rounded-xl border bg-white p-6 shadow transition hover:border-emerald-600 hover:shadow-lg"
        >
          <h3 className="text-xl font-semibold text-emerald-700">
            Histórico
          </h3>
          <p className="mt-2 text-gray-600">
            Consulte respostas geradas, pareceres e atendimentos anteriores.
          </p>
        </Link>
      </section>

      <section className="mt-10">
        <h3 className="mb-4 text-xl font-semibold text-emerald-700">
          Indicadores do Dia
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-xl border bg-white p-6 shadow">
            <p className="text-gray-500">Atendimentos IA</p>
            <p className="text-3xl font-bold text-emerald-700">0</p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow">
            <p className="text-gray-500">Avaliações Técnicas</p>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow">
            <p className="text-gray-500">Mensagens Enviadas</p>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow">
            <p className="text-gray-500">Tempo Médio</p>
            <p className="text-3xl font-bold text-emerald-700">—</p>
          </div>
        </div>
      </section>
    </main>
  );
}