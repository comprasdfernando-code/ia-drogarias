"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

// Tipagem do produto
interface Produto {
  id: number;
  nome: string;
  preco: string;
  imagem: string;
  descricao: string;
}

export default function Page() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [resultado, setResultado] = useState<Produto[]>([]);

  // Carregar JSON
  useEffect(() => {
    fetch("/data/produtos.json")
      .then((res) => res.json())
      .then((data) => {
        setProdutos(data);
        setResultado(data);
      });
  }, []);

  // Função de busca
  const handleBuscar = () => {
    if (busca.trim() === "") {
      setResultado(produtos);
    } else {
      const filtrados = produtos.filter((p) =>
        p.nome.toLowerCase().includes(busca.toLowerCase())
      );
      setResultado(filtrados);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header fixo */}
      <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
        {/* Logo */}
        <div className="flex justify-center py-2 border-b border-gray-200">
          <img
            src="/logo.png"
            alt="IA Drogarias"
            className="h-12"
          />
        </div>

        {/* Barra de busca full width */}
        <div className="sticky top-0 bg-white border-b border-gray-300 shadow z-40">
          <div className="flex w-full">
            <input
              type="text"
              placeholder="Buscar medicamentos, produtos de saúde..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1 px-4 py-3 text-base border-0 focus:outline-none"
            />
            <button
              onClick={handleBuscar}
              className="px-6 py-3 bg-teal-600 text-white text-base font-semibold hover:bg-teal-700 transition"
            >
              Buscar
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo (com espaço para não ficar escondido atrás do header) */}
      <main className="pt-40 px-4 w-full max-w-6xl">
        <h2 className="text-2xl font-bold mb-6">Nossos Produtos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {resultado.map((produto) => (
            <div
              key={produto.id}
              className="border rounded-lg p-3 shadow bg-white hover:shadow-lg transition"
            >
              {/* Imagem */}
              <img
                src={produto.imagem}
                alt={produto.nome}
                className="w-full h-40 object-contain mb-2"
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
                <button className="mt-2 w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition">
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