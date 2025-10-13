"use client";

import React, { useEffect, useState } from "react";

// Tipagem do produto
interface Produto {
  id: number;
  nome: string;
  preco: string;
  imagem: string;
  descricao?: string;
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
    <div className="w-full flex flex-col">
      {/* Header com faixa */}
      <header className="sticky top-0 z-40 w-full shadow-md bg-white">
        <div className="w-full">
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

      {/* Carrossel de Produtos */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="text-2xl font-bold mb-6">Nossos Produtos</h2>

        <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
          {produtos.map((produto) => (
            <div
              key={produto.id}
              className="min-w-[200px] border rounded-lg p-3 shadow bg-white flex-shrink-0 hover:shadow-lg transition"
            >
              {/* Imagem */}
              <img
                src={produto.imagem}
                alt={produto.nome}
                className="w-full h-32 object-contain mb-2"
              />

              {/* Nome */}
              <h2 className="text-sm font-bold text-center">{produto.nome}</h2>

              {/* Preço */}
              <p className="text-lg font-bold text-green-600 text-center">
                {produto.preco}
              </p>

              {/* Botão WhatsApp */}
              <a
                href={`https://wa.me/5511952068432?text=Olá, quero comprar ${encodeURIComponent(
                  produto.nome
                )} por ${encodeURIComponent(produto.preco)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="mt-2 w-full bg-teal-600 text-white py-1 rounded hover:bg-teal-700 transition">
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