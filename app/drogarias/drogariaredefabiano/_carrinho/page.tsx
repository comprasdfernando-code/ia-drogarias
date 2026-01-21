"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type ItemCarrinho = {
  id: string;
  nome: string;
  categoria?: string;
  preco_venda: number;
  quantidade: number;
  imagem?: string;
};

export default function CarrinhoPage() {
  const [mounted, setMounted] = useState(false);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  // ✅ Garante que só roda no client (evita erro 418)
  useEffect(() => {
    setMounted(true);
    const salvo = localStorage.getItem("carrinhoFabiano");
    if (salvo) {
      try {
        setCarrinho(JSON.parse(salvo));
      } catch {
        setCarrinho([]);
      }
    }
  }, []);

  // 🔄 Persistir alterações
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("carrinhoFabiano", JSON.stringify(carrinho));
    }
  }, [carrinho, mounted]);

  if (!mounted) return null;

  const total = carrinho.reduce(
    (acc, item) => acc + item.preco_venda * item.quantidade,
    0
  );

  function remover(id: string) {
    setCarrinho((prev) => prev.filter((p) => p.id !== id));
  }

  function alterarQtd(id: string, delta: number) {
    setCarrinho((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, quantidade: Math.max(1, p.quantidade + delta) }
          : p
      )
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-blue-700 text-center mb-8">
        🛒 Carrinho — Drogaria Rede Fabiano
      </h1>

      {carrinho.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>Seu carrinho está vazio.</p>

          <Link
            href="/drogarias/drogariaredefabiano"
            className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700"
          >
            🛍️ Voltar à loja
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {carrinho.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 bg-white rounded-lg shadow p-4"
              >
                <Image
                  src={p.imagem || "/produtos/caixa-padrao.png"}
                  alt={p.nome}
                  width={80}
                  height={80}
                  className="rounded object-contain"
                />

                <div className="flex-1">
                  <h2 className="font-semibold text-blue-800">{p.nome}</h2>
                  <p className="text-sm text-gray-500">{p.categoria}</p>
                  <p className="font-bold text-green-600">
                    R$ {p.preco_venda.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alterarQtd(p.id, -1)}
                    className="px-2 bg-gray-200 rounded"
                  >
                    −
                  </button>
                  <span>{p.quantidade}</span>
                  <button
                    onClick={() => alterarQtd(p.id, 1)}
                    className="px-2 bg-gray-200 rounded"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => remover(p.id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>

          {/* TOTAL */}
          <div className="mt-8 text-right">
            <p className="text-xl font-bold text-blue-800">
              Total: R$ {total.toFixed(2)}
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <Link
                href="/drogarias/drogariaredefabiano"
                className="bg-gray-200 px-6 py-3 rounded-md text-center font-semibold"
              >
                ⬅️ Continuar comprando
              </Link>

              <button
                onClick={() =>
                  alert("🔜 Próximo passo: pedido + WhatsApp automático")
                }
                className="bg-green-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-green-700"
              >
                ✅ Finalizar pedido
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
