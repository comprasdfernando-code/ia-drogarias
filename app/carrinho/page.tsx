"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Produto {
  id: string;
  nome: string;
  preco: number;
}

export default function CarrinhoPage() {
  const [carrinho, setCarrinho] = useState<Produto[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const itensSalvos = JSON.parse(localStorage.getItem("carrinho") || "[]");
      setCarrinho(itensSalvos);
    }
  }, []);

  const removerItem = (id: string) => {
    const novoCarrinho = carrinho.filter((item) => item.id !== id);
    setCarrinho(novoCarrinho);
    localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
  };

  const total = carrinho.reduce((acc, item) => acc + item.preco, 0);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">🛒 Meu Carrinho</h1>

      {carrinho.length === 0 ? (
        <div className="text-center text-gray-600">
          <p>Seu carrinho está vazio 😅</p>
          <Link href="/produtos" className="text-blue-600 underline mt-4 inline-block">
            Continuar comprando
          </Link>
        </div>
      ) : (
        <div>
          {carrinho.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center bg-white p-4 rounded-lg shadow mb-3"
            >
              <div>
                <p className="font-semibold text-gray-800">{item.nome}</p>
                <p className="text-green-700 font-bold">
                  R$ {item.preco.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => removerItem(item.id)}
                className="text-red-600 hover:underline"
              >
                Remover
              </button>
            </div>
          ))}

          <div className="mt-6 text-right font-bold text-xl text-blue-700">
            Total: R$ {total.toFixed(2)}
          </div>

          <button
            onClick={() => alert("Pedido finalizado!")}
            className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Finalizar Pedido
          </button>
        </div>
      )}
    </div>
  );
}