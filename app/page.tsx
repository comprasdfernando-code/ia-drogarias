"use client";

import Carrossel from "../components/Carrossel";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold text-gray-800 mt-6">
        Bem-vindo à IA Drogarias
      </h1>

      {/* Carrossel */}
      <Carrossel />
    </div>
  );
}
