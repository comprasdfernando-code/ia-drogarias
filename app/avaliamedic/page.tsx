export const dynamic = "force-dynamic";

"use client";

import Link from "next/link";

export default function AvaliaMedicDashboard() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      
      {/* HEADER */}
      <header className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-semibold text-emerald-700">
          AvaliaMedic AI
        </h1>

        <Link
          href="/avaliamedic/login"
          className="text-emerald-700 font-medium hover:underline"
        >
          Sair
        </Link>
      </header>

      {/* BANNER NOVO POSICIONAMENTO */}
      <section className="bg-black border shadow-sm rounded-xl p-6 mb-10">
        <h2 className="text-2xl font-semibold text-emerald-400">
          Atendimento Inteligente para Drogarias
        </h2>
        <p className="text-gray-300 mt-2">
          Envie o print da conversa ou receita + print do orçamento e receba uma
          resposta pronta, profissional e pronta para copiar no WhatsApp.
        </p>
      </section>

      {/* AÇÕES RÁPIDAS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 🚀 NOVO FLUXO PRINCIPAL */}
        <Link
          href="/avaliamedic"
          className="bg-emerald-700 text-white p-6 rounded-xl shadow hover:bg-emerald-800 transition block"
        >
          <h3 className="text-xl font-semibold">Gerar Resposta Automática</h3>
          <p className="text-emerald-100 mt-2">
            Envie prints do cliente e do sistema e gere a resposta pronta para WhatsApp.
          </p>
        </Link>

        {/* 🔁 FLUXO ANTIGO (mantido) */}
        <Link
          href="/avaliamedic/enviar"
          className="bg-white border p-6 rounded-xl shadow hover:border-emerald-600 hover:shadow-lg transition block"
        >
          <h3 className="text-xl font-semibold text-emerald-700">
            Avaliação Técnica
          </h3>
          <p className="text-gray-600 mt-2">
            Avaliar prescrição com análise farmacêutica detalhada.
          </p>
        </Link>

        {/* 📊 HISTÓRICO */}
        <Link
          href="/avaliamedic/relatorio"
          className="bg-white border p-6 rounded-xl shadow hover:border-emerald-600 hover:shadow-lg transition block"
        >
          <h3 className="text-xl font-semibold text-emerald-700">
            Histórico de Atendimentos
          </h3>
          <p className="text-gray-600 mt-2">
            Consulte respostas geradas, orçamentos e atendimentos anteriores.
          </p>
        </Link>

      </section>

      {/* INDICADORES REAIS DO SaaS */}
      <section className="mt-10">
        <h3 className="text-xl font-semibold text-emerald-700 mb-4">
          Indicadores do Dia
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="bg-white p-6 border rounded-xl shadow">
            <p className="text-gray-500">Atendimentos IA</p>
            <p className="text-3xl font-bold text-emerald-700">0</p>
          </div>

          <div className="bg-white p-6 border rounded-xl shadow">
            <p className="text-gray-500">Orçamentos Gerados</p>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>

          <div className="bg-white p-6 border rounded-xl shadow">
            <p className="text-gray-500">Conversões</p>
            <p className="text-3xl font-bold text-green-600">0%</p>
          </div>

          <div className="bg-white p-6 border rounded-xl shadow">
            <p className="text-gray-500">Tempo Médio</p>
            <p className="text-3xl font-bold text-emerald-700">—</p>
          </div>

        </div>
      </section>

      {/* FUTURO (UPSELL INTERNO) */}
      <section className="mt-10 bg-white border rounded-xl p-6 shadow">
        <h3 className="text-lg font-semibold text-emerald-700 mb-2">
          💡 Dica
        </h3>
        <p className="text-gray-600">
          Use prints com boa qualidade para melhor leitura da IA. Em breve:
          integração automática com WhatsApp e leitura de áudio.
        </p>
      </section>

    </main>
  );
}