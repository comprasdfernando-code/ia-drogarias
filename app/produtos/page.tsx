"use client";

import { useState, useEffect } from "react";

interface Produto {
  id: string;
  nome: string;
  preco: number;
}

export default function ProdutosPage() {
  const produtos: Produto[] = [
    { id: "1", nome: "Dipirona Sódica 500mg", preco: 12.9 },
    { id: "2", nome: "Paracetamol 750mg", preco: 9.5 },
    { id: "3", nome: "Omeprazol 20mg", preco: 15.9 },
    { id: "4", nome: "Vitamina C 1g", preco: 18.0 },
    { id: "5", nome: "Amoxicilina 500mg", preco: 24.9 },
  ];

  const [busca, setBusca] = useState("");

  const adicionarAoCarrinho = (produto: Produto) => {
    if (typeof window !== "undefined") {
      const carrinhoAtual = JSON.parse(localStorage.getItem("carrinho") || "[]");
      carrinhoAtual.push(produto);
      localStorage.setItem("carrinho", JSON.stringify(carrinhoAtual));
      alert(produto.nome + "adicionado ao carrinho");
    }
  };

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">🛍️ Produtos Disponíveis</h1>

      {/* Campo de busca */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full sm:w-1/2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Lista de produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {produtosFiltrados.map((produto) => (
          <div
            key={produto.id}
            className="bg-white rounded-lg shadow p-4 flex flex-col items-center hover:shadow-lg transition"
          >
            <p className="font-semibold text-gray-800 text-center mb-2">{produto.nome}</p>
            <p className="text-green-700 font-bold mb-3">
              R$ {produto.preco.toFixed(2)}
            </p>
            <button
              onClick={() => adicionarAoCarrinho(produto)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Adicionar ao Carrinho
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}