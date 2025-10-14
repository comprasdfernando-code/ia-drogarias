"use client";

import Link from "next/link";


const SERVICOS = [
  {
    nome: "Aferição de Pressão Arterial",
    slug: "pressao",
    desc: "Verificação dos níveis de pressão arterial.",
  },
  {
    nome: "Medição de Glicemia",
    slug: "glicemia",
    desc: "Teste rápido de glicose no sangue.",
  },
  {
    nome: "Revisão de Medicamentos",
    slug: "revisao",
    desc: "Análise e orientação sobre o uso correto de medicamentos.",
  },
  {
    nome: "Consulta Farmacêutica",
    slug: "consulta",
    desc: "Atendimento personalizado com farmacêutico habilitado.",
  },
  {
    nome: "Aplicação de Vacinas",
    slug: "vacinas",
    desc: "Administração de vacinas com segurança e conforto.",
  },
  {
    nome: "Consultoria em Fitoterápicos",
    slug: "fitos",
    desc: "Orientação sobre o uso seguro de plantas medicinais.",
  },

  // 💗 Serviços de Estética (novos adicionados)
  {
    nome: "Limpeza de Pele",
    slug: "limpeza-pele",
    desc: "Remoção de impurezas e renovação da pele com técnica profissional.",
  },
  {
    nome: "Peeling Químico",
    slug: "peeling",
    desc: "Tratamento que melhora textura e brilho da pele, reduzindo manchas.",
  },
  {
    nome: "Microagulhamento",
    slug: "microagulhamento",
    desc: "Estimula o colágeno e melhora cicatrizes, manchas e linhas de expressão.",
  },
  {
    nome: "Aplicação de Enzimas",
    slug: "enzimas",
    desc: "Auxilia na redução de gordura localizada e modelagem corporal.",
  },
];

export default function ServicosPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      {/* Título principal */}
      <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">
        Serviços Farmacêuticos e Estéticos
      </h1>

      {/* Lista de serviços */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICOS.map((s) => (
          <div
            key={s.slug}
            className="p-6 border rounded-2xl shadow-md hover:shadow-lg transition bg-white flex flex-col justify-between"
          >
            {/* Nome e descrição */}
            <div>
              <h2 className="text-xl font-semibold mb-2 text-blue-700">
                {s.nome}
              </h2>
              <p className="text-gray-600 mb-4">{s.desc}</p>
            </div>

            {/* Botão de agendamento */}
            <Link
              href={`/servicos/agenda?servico=${encodeURIComponent(s.nome)}`}
              className="block text-center mt-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              Agendar
            </Link>
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <p className="text-center text-gray-500 text-sm mt-10">
        💙 IA Drogarias — Saúde com Inteligência
      </p>
    </main>
  );
}

