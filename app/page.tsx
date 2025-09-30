"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center flex-grow text-center p-6">
      {/* Título */}
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Bem-vindo à IA Drogarias
      </h1>

      {/* Botões principais */}
      <div className="flex flex-col space-y-4 w-full max-w-xs">
        <Link
          href="/servicos"
          className="bg-blue-600 text-white py-4 rounded-lg shadow-lg hover:bg-blue-700 transition text-lg font-semibold text-center"
        >
          Solicitar Serviço Farmacêutico
        </Link>

        <Link
          href="/farmacia"
          className="bg-green-600 text-white py-4 rounded-lg shadow-lg hover:bg-green-700 transition text-lg font-semibold text-center"
        >
          Comprar Medicamento
        </Link>
      </div>
    </div>
  );
}
