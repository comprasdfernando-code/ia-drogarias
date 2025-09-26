"use client";
import React, { useEffect, useState } from "react";

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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3">
            <img
              src="/logo-iadrogarias.png"
              alt="Logo IA Drogarias"
              className="w-12 h-12 rounded-xl shadow-md"
            />
            <div>
              <span className="block text-xl font-bold">IA Drogarias</span>
              <span className="block text-xs text-gray-500">
                Farmácia Virtual · Saúde simples
              </span>
            </div>
          </div>

          {/* Barra de Pesquisa */}
          <div className="w-full flex justify-center mt-3">
            <input
              type="text"
              placeholder="Buscar medicamentos, produtos de saúde..."
              className="w-3/4 md:w-1/2 px-4 py-2 rounded-l-2xl border border-gray-300 text-sm focus:outline-none"
            />
            <button className="px-4 py-2 bg-teal-600 text-white rounded-r-2xl hover:bg-teal-700">
              Buscar
            </button>
          </div>
        </div>
      </header>

      {/* Grid de Produtos */}
<main className="mx-auto max-w-6xl px-4 py-6">
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {produtos.map((produto) => (
      <div
        key={produto.id}
        className="relative border rounded-lg p-3 shadow-md bg-white hover:shadow-lg transition"
      >
        {/* Imagem */}
        <img
          src={produto.imagem}
          alt={produto.nome}
          width={150}
          height={150}
          className="object-contain mx-auto"
          loading="lazy"
        />

        {/* Nome */}
        <h2 className="text-sm font-bold mt-2 text-center">
          {produto.nome}
        </h2>

        {/* Preço */}
        <p className="text-lg font-bold text-green-600 text-center">
          {produto.preco}
        </p>

        {/* Botão Comprar */}
        <button className="mt-2 w-full bg-blue-600 text-white py-1 rounded hover:bg-blue-700 transition">
          Comprar
        </button>
      </div>
    ))}
  </div>
</main>
    </div>
  );
}