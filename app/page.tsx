"use client";

import React, { useState } from "react";

export default function Page() {
  const [q, setQ] = useState("");

  return (
    <div className="w-full flex flex-col items-center">
      {/* Faixa do topo */}
      <header className="sticky top-0 z-40 w-full shadow-md bg-white">
        <div className="w-full flex justify-center">
          <img
            src="/faixa-topo.png"
            alt="Faixa IA Drogarias"
            className="w-[95%] max-w-screen-lg mx-auto"
          />
        </div>

        {/* Barra de busca */}
        <div className="w-full bg-white border-t border-gray-200 flex justify-center gap-0 px-4 py-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder="Buscar medicamentos, produtos de saúde..."
            className="w-3/4 md:w-1/2 px-4 py-2 rounded-l-2xl border border-gray-300 text-sm focus:outline-none"
          />
          <button
            onClick={() => setQ("")}
            className="px-4 py-2 bg-teal-600 text-white rounded-r-2xl hover:bg-teal-700"
          >
            Buscar
          </button>
        </div>
      </header>

      {/* Área de teste (sem produtos ainda) */}
      <main className="mx-auto max-w-6xl px-4 py-10 w-full">
        <h2 className="text-2xl font-bold mb-2">Página OK ✅</h2>
        <p className="text-gray-600">
          A faixa e a barra de busca estão funcionando. Próximo passo: grid de produtos.
        </p>
      </main>
    </div>
  );
}