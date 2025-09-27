"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

// Tipagem do produto
interface Produto {
  id: number;
  nome: string;
  preco: string;
  imagem: string;
}

export default function Page() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // Carregar JSON
  useEffect(() => {
    fetch("/data/produtos.json")
      .then((res) => res.json())
      .then((data) => setProdutos(data));
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header com faixa em imagem */}
      <header className="sticky top-0 z-40 w-full shadow-md bg-white">
        <div className="w-full flex justify-center">
          <img
            src="/faixa-topo.png"
            alt="Faixa IA Drogarias"
            className="w-[95%] max-w-screen-lg mx-auto"
          />
        </div>

        {/* Barra de busca */}
        <div className="w-full bg-white border-t border-gray-200 flex justify-center px-4 py-2">
          <input
            type="text"
            placeholder="Buscar medicamentos, produtos de saúde..."
            className="w-3/4 md:w-1/2 px-4 py-2 rounded-l-2xl border border-gray-300 text-sm focus:outline-none"
          />
          <button className="px-4 py-2 bg-teal-600 text-white rounded-r-2xl hover:bg-teal-700">
            Buscar
          </button>
        </div>
      </header>

      {/* Grid de Produtos */}
      <main className="mx-auto max-w-6xl px-4 py-6">
  <h2 className="text-2xl font-bold mb-6">Nossos Produtos</h2>

  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    {produtos.map((produto) => (
      <div
        key={produto.id}
        className="group border rounded-lg p-3 shadow bg-white hover:shadow-lg transition overflow-hidden"
      >
        {/* Imagem + Nome levam para a página de detalhes */}
        <Link href={`/produto/${produto.id}`} className="block">
          <div className="aspect-[4/5] w-full bg-white">
            <img
              src={produto.imagem}
              alt={produto.nome}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <h3 className="mt-2 text-sm font-bold text-center line-clamp-2">
            {produto.nome}
          </h3>
        </Link>

        {/* Preço */}
        <p className="mt-1 text-lg font-bold text-green-600 text-center">
          {produto.preco}
        </p>

        {/* Botão WhatsApp */}
        <a
          href={wa(produto)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block"
        >
          <button className="w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 transition">
            Comprar via WhatsApp
          </button>
        </a>
      </div>
    ))}
  </div>
</main>
    </div>
  );
}