"use client";

import { useState } from "react";

export default function FarmaciaPage() {
  const produtos = [
    { nome: "Dipirona Sódica 500mg", preco: 12.9 },
    { nome: "Paracetamol 750mg", preco: 9.5 },
    { nome: "Amoxicilina 500mg", preco: 24.9 },
    { nome: "Vitamina C 1g", preco: 18.0 },
    { nome: "Omeprazol 20mg", preco: 15.9 },
  ];

  const [carrinho, setCarrinho] = useState<{ nome: string; preco: number }[]>([]);

  const adicionarAoCarrinho = (produto: { nome: string; preco: number }) => {
    setCarrinho([...carrinho, produto]);
    alert(`${produto.nome} adicionado ao carrinho! 🛒`);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-grow p-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">
        Farmácia Virtual
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {produtos.map((produto, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition flex flex-col justify-between border border-gray-200"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {produto.nome}
              </h2>
              <p className="text-gray-700 mb-4 font-medium">
                💰 R$ {produto.preco.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <button
              onClick={() => adicionarAoCarrinho(produto)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Adicionar ao Carrinho
            </button>
          </div>
        ))}
      </div>

      {carrinho.length > 0 && (
        <div className="mt-10 bg-blue-50 p-4 rounded-xl shadow w-full max-w-3xl">
          <h2 className="text-xl font-semibold mb-3 text-blue-800">
            🛒 Itens no Carrinho:
          </h2>
          <ul className="text-gray-700">
            {carrinho.map((item, i) => (
              <li key={i} className="flex justify-between border-b py-1">
                <span>{item.nome}</span>
                <span>
                  R$ {item.preco.toFixed(2).replace(".", ",")}
                </span>
              </li>
            ))}
          </ul>
          <p className="font-bold text-right mt-3 text-blue-700">
            Total:{" "}
            R${" "}
            {carrinho
              .reduce((acc, item) => acc + item.preco, 0)
              .toFixed(2)
              .replace(".", ",")}
          </p>
        </div>
      )}
    </div>
  );
}
