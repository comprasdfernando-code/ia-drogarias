"use client";

import Link from "next/link";

const SERVICOS = [
  { nome: "Aferição de Pressão Arterial", slug: "pressao", desc: "Verificação dos níveis de pressão." },
  { nome: "Medição de Glicemia", slug: "glicemia", desc: "Teste de glicose no sangue." },
  { nome: "Revisão de Medicamentos", slug: "revisao", desc: "Análise e orientação de uso." },
  { nome: "Consulta Farmacêutica", slug: "consulta", desc: "Atendimento personalizado." },
  { nome: "Aplicação de Vacinas", slug: "vacinas", desc: "Administração por farmacêutico." },
  { nome: "Consultoria em Fitoterápicos", slug: "fitos", desc: "Orientação sobre fitoterápicos." },
];

export default function ServicosPage() {
  return (
    <main className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-semibold mb-6 text-blue-700 text-center">
        Serviços Farmacêuticos
      </h1>

      <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
        {SERVICOS.map((s) => (
          <div
            key={s.slug}
            className="p-6 border rounded-2xl shadow-md hover:shadow-lg transition bg-white flex flex-col justify-between"
          >
            <div>
              <h2 className="text-xl font-semibold mb-2 text-blue-700">
                {s.nome}
              </h2>
              <p className="text-gray-600 mt-1">{s.desc}</p>
            </div>

            <Link
              href={`/agenda?servico=${encodeURIComponent(s.nome)}`}
              className="mt-4 px-4 py-2 text-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Agendar
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
