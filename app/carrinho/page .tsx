"use client";

import { useEffect, useState } from "react";

export default function CarrinhoPage() {
  const [carrinho, setCarrinho] = useState<any[]>([]);

  useEffect(() => {
    const salvo = localStorage.getItem("carrinho");
    if (salvo) setCarrinho(JSON.parse(salvo));
  }, []);

  const removerItem = (index: number) => {
    const novoCarrinho = carrinho.filter((_, i) => i !== index);
    setCarrinho(novoCarrinho);
    localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">🛒 Meu Carrinho</h1>

      {carrinho.length === 0 ? (
        <p className="text-gray-600">Seu carrinho está vazio.</p>
      ) : (
        <div className="space-y-4">
          {carrinho.map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-white shadow p-3 rounded-lg"
            >
              <div>
                <p className="font-semibold">{item.nome}</p>
                <p className="text-green-600 font-bold">{item.preco}</p>
              </div>
              <button
                onClick={() => removerItem(i)}
                className="text-red-600 hover:text-red-800 transition"
              >
                Remover
              </button>
            </div>
          ))}

          <div className="mt-6 text-right">
            <button
              onClick={() => {
                alert("Pedido enviado com sucesso!");
                localStorage.removeItem("carrinho");
                setCarrinho([]);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Finalizar Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
