export const dynamic = "force-static";

import Link from "next/link";

export default function AvaliaMedicDashboard() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <header className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-semibold text-emerald-700">
          AvaliaMedic
        </h1>

        <Link
          href="/avaliamedic/login"
          className="text-emerald-700 font-medium hover:underline"
        >
          Sair
        </Link>
      </header>

      {/* BANNER */}
      <section className="bg-black border shadow-sm rounded-xl p-6 mb-10">
        <h2 className="text-2xl font-semibold text-emerald-700">
          Segurança Medicamentosa Inteligente
        </h2>
        <p className="text-gray-600 mt-2">
          Avalie prescrições hospitalares com apoio de IA e melhore a segurança
          da administração de medicamentos em todos os setores.
        </p>
      </section>

      {/* AÇÕES RÁPIDAS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD – Nova Avaliação */}
        <Link
          href="/avaliamedic/enviar"
          className="bg-emerald-700 text-white p-6 rounded-xl shadow hover:bg-emerald-800 transition block"
        >
          <h3 className="text-xl font-semibold">Nova Avaliação</h3>
          <p className="text-emerald-100 mt-2">
            Enviar foto ou PDF da prescrição para análise inteligente.
          </p>
        </Link>

        {/* CARD – Histórico */}
        <Link
          href="#"
          className="bg-white border p-6 rounded-xl shadow hover:border-emerald-600 hover:shadow-lg transition block"
        >
          <h3 className="text-xl font-semibold text-emerald-700">
            Histórico de Avaliações
          </h3>
          <p className="text-gray-600 mt-2">
            Consulte prescrições avaliadas e pareceres registrados.
          </p>
        </Link>

      </section>

      {/* INDICADORES */}
      <section className="mt-10">
        <h3 className="text-xl font-semibold text-emerald-700 mb-4">
          Indicadores do Dia
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 border rounded-xl shadow">
            <p className="text-gray-500">Prescrições Avaliadas</p>
            <p className="text-3xl font-bold text-emerald-700">0</p>
          </div>

          <div className="bg-white p-6 border rounded-xl shadow">
            <p className="text-gray-500">Alertas Emitidos</p>
            <p className="text-3xl font-bold text-red-600">0</p>
          </div>

          <div className="bg-white p-6 border rounded-xl shadow">
            <p className="text-gray-500">Tempo Médio de Resposta</p>
            <p className="text-3xl font-bold text-emerald-700">—</p>
          </div>
        </div>
      </section>
    </main>
  );
}
