"use client";

import Link from "next/link";

export default function ServicosPage() {
  const servicos = [
    {
      nome: "Aferição de Pressão",
      descricao: "Verifique sua pressão arterial com segurança.",
      cor: "bg-blue-100",
      href: "/servicos/pressao",
    },
    {
      nome: "Teste de Glicemia",
      descricao: "Resultado rápido para monitorar sua glicose.",
      cor: "bg-green-100",
      href: "/servicos/glicemia",
    },
    {
      nome: "Aplicação de Injetáveis",
      descricao: "Profissional capacitado para aplicação segura.",
      cor: "bg-yellow-100",
      href: "/servicos/injetaveis",
    },
    {
      nome: "Orientação Farmacêutica",
      descricao: "Tire suas dúvidas com um farmacêutico.",
      cor: "bg-purple-100",
      href: "/servicos/orientacao",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center flex-grow p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Serviços Farmacêuticos
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
        {servicos.map((servico, index) => (
          <div
            key={index}
            className={`${servico.cor} p-6 rounded-lg shadow hover:shadow-lg transition`}
          >
            <h2 className="text-xl font-semibold mb-2">{servico.nome}</h2>
            <p className="text-gray-700 mb-4">{servico.descricao}</p>
            <Link
              href={servico.href}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Agendar
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
