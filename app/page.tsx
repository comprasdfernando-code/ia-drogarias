"use client";

import React, { useEffect, useState } from "react";

// Tipagem do produto
interface Produto {
  id: number;
  nome: string;
  preco: string;
  imagem: string;
}

export default function Page() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [resultado, setResultado] = useState<Produto[]>([]);

  // Carregar produtos do JSON
  useEffect(() => {
    fetch("/data/produtos.json")
      .then((res) => res.json())
      .then((data) => {
        setProdutos(data);
        setResultado(data);
      });
  }, []);

  // Função de busca
  useEffect(() => {
    if (busca.trim() === "") {
      setResultado(produtos);
    } else {
      const filtrados = produtos.filter((p) =>
        p.nome.toLowerCase().includes(busca.toLowerCase())
      );
      setResultado(filtrados);
    }
  }, [busca, produtos]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header fixo com faixa + busca */}
      <header className="sticky top-0 z-50 bg-white shadow-md w-full">
        {/* Faixa */}
        <div className="w-full flex justify-center py-2">
          <img
            src="/faixa-topo.png"
            alt="Faixa IA Drogarias"
            className="w-[95%] max-w-screen-lg mx-auto"
          />
        </div>

        {/* Barra de busca */}
        <div className="px-4 pb-3">
          <input
            type="text"
            placeholder="Buscar medicamentos, produtos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full border px-3 py-2 rounded shadow-sm"
          />
        </div>
      </header>

      {/* Grid de Produtos */}
      <main className="mx-auto max-w-6xl px-4 py-6 w-full">
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