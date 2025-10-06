"use client";

import { useState, useEffect } from "react";

export default function ProdutosPage() {
  const produtos = [
    { nome: "Dipirona Sódica 500mg", preco: "R$ 12,90", img: "/produtos/dipirona.jpg" },
    { nome: "Paracetamol 750mg", preco: "R$ 9,50", img: "/produtos/paracetamol.jpg" },
    { nome: "Omeprazol 20mg", preco: "R$ 15,90", img: "/produtos/omeprazol.jpg" },
    { nome: "Vitamina C 1g", preco: "R$ 18,00", img: "/produtos/vitamina-c.jpg" },
    { nome: "Amoxicilina 500mg", preco: "R$ 24,90", img: "/produtos/amoxicilina.jpg" },
  ];

  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<any[]>([]);

  // Carrega o carrinho salvo ao abrir a página
  useEffect(() => {
    const salvo = localStorage.getItem("carrinho");
    if (salvo) setCarrinho(JSON.parse(salvo));
  }, []);

  // Adiciona produto ao carrinho
  const adicionarAoCarrinho = (produto: any) => {
    const novoCarrinho = [...carrinho, produto];
    setCarrinho(novoCarrinho);
    localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
    alert(`${produto.nome} foi adicionado ao carrinho!`);
  };

  // Filtro de produtos
  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
        🛒 Produtos em Oferta
      </h1>

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

      {/* Grid de produtos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {produtosFiltrados.length > 0 ? (
          produtosFiltrados.map((p, i) => (
            <div
              key={i}
              className="bg-white shadow-md rounded-xl p-4 hover:shadow-lg transition flex flex-col items-center"
            >
              <img
                src={p.img}
                alt={p.nome}
                className="h-32 object-contain mb-3"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <p className="font-semibold text-gray-800 text-center">{p.nome}</p>
              <p className="text-green-600 font-bold mt-1">{p.preco}</p>
              <button
                onClick={() => adicionarAoCarrinho(p)}
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-600 text-center col-span-full">
            Nenhum produto encontrado 😕
          </p>
        )}
      </div>
    </div>
  );
}
