"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function CarrinhoPage() {
  const [carrinho, setCarrinho] = useState<any[]>([]);

  // 🔄 Recupera o carrinho salvo no localStorage
  useEffect(() => {
    const salvo = localStorage.getItem("carrinhoFabiano");
    if (salvo) setCarrinho(JSON.parse(salvo));
  }, []);

  // 💰 Calcula o total
  const total = carrinho.reduce(
    (acc, item) => acc + item.preco_venda * item.quantidade,
    0
  );

  // 🗑️ Remover item do carrinho
  const removerItem = (id: string) => {
    const atualizado = carrinho.filter((p) => p.id !== id);
    setCarrinho(atualizado);
    localStorage.setItem("carrinho-rede-fabiano", JSON.stringify(atualizado));
  };

  // ➕ Aumentar quantidade
  const alterarQuantidade = (id: string, delta: number) => {
    const atualizado = carrinho.map((p) =>
      p.id === id
        ? { ...p, quantidade: Math.max(1, p.quantidade + delta) }
        : p
    );
    setCarrinho(atualizado);
    localStorage.setItem("carrinho-rede-fabiano", JSON.stringify(atualizado));
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-blue-700 text-center mb-8">
        🛒 Carrinho - Drogaria Rede Fabiano
      </h1>

      {carrinho.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>Seu carrinho está vazio.</p>

          <Link
            href="/drogarias/drogariaredefabiano"
            className="inline-block mt-4 text-blue-600 underline font-semibold"
          >
            Voltar à loja
          </Link>

          <button
            onClick={() =>
              (window.location.href = "/drogarias/drogariaredefabiano")
            }
            className="mt-6 w-full sm:w-auto bg-blue-600 text-white font-semibold py-3 px-6 rounded-md shadow hover:bg-blue-700 transition"
          >
            🛍️ Continuar Comprando
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {carrinho.map((p) => (
            <div
              key={p.id}
              className="flex flex-col sm:flex-row items-center gap-4 bg-white rounded-lg shadow p-4"
            >
              <Image
                src={p.imagem || "/no-image.png"}
                alt={p.nome}
                width={80}
                height={80}
                className="rounded"
              />
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-semibold text-blue-800">{p.nome}</h2>
                <p className="text-gray-500 text-sm">{p.categoria}</p>
                <p className="text-green-600 font-bold">
                  R$ {Number(p.preco_venda).toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alterarQuantidade(p.id, -1)}
                  className="bg-gray-200 px-2 rounded hover:bg-gray-300"
                >
                  -
                </button>
                <span className="w-6 text-center">{p.quantidade}</span>
                <button
                  onClick={() => alterarQuantidade(p.id, 1)}
                  className="bg-gray-200 px-2 rounded hover:bg-gray-300"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => removerItem(p.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remover
              </button>
            </div>
          ))}

          {/* 💰 Total */}
          <div className="text-right mt-8">
            <p className="text-xl font-bold text-blue-800">
              Total: R$ {total.toFixed(2)}
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <Link
                href="/drogarias/drogariaredefabiano"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md shadow text-center transition"
              >
                🛍️ Continuar Comprando
              </Link>

              <button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md shadow transition"
                onClick={() =>
                  alert("🧾 Em breve: integração com pedidos e WhatsApp!")
                }
              >
                ✅ Finalizar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}