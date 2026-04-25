"use client";

import { useCart } from "@/app/fv/_components/cart";
import { useCartUI } from "@/app/fv/_components/cart-ui";
import Link from "next/link";

export default function CartDrawer() {
  const { items, subtotal } = useCart();
  const { cartOpen, closeCart } = useCartUI();
  const { endereco } = useCart();

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Fundo */}
      <div
        className="flex-1 bg-black/40"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="w-[380px] bg-white h-full shadow-xl p-4 flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Seu carrinho</h2>
          <button onClick={closeCart}>✕</button>
        </div>

        {/* Produtos */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {items.length === 0 && (
            <div className="text-sm text-gray-500">
              Seu carrinho está vazio
            </div>
          )}

          {items.map((item) => (
            <div key={item.ean} className="border p-2 rounded">
              <div className="text-sm font-medium">{item.nome}</div>
              <div className="text-xs text-gray-500">
                {item.qtd}x R$ {item.preco.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* 🔥 ENDEREÇO */}
        <div className="mt-4 p-3 rounded-lg border bg-gray-50">
          <div className="text-sm font-semibold mb-1">Entrega</div>

          {endereco ? (
            <>
              <div className="text-xs text-gray-700">
                {endereco.endereco}, {endereco.numero}
              </div>
              <div className="text-xs text-gray-500">
                {endereco.bairro}
              </div>

              <Link
                href="/fv/minha-conta/enderecos"
                className="text-xs text-blue-600 mt-2 inline-block underline"
              >
                Trocar endereço
              </Link>
            </>
          ) : (
            <>
              <div className="text-xs text-red-500">
                Nenhum endereço cadastrado
              </div>

              <Link
                href="/fv/minha-conta/enderecos"
                className="text-xs text-blue-600 mt-2 inline-block underline"
              >
                Adicionar endereço
              </Link>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between text-sm mb-3">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>

          <Link
            href="/fv/checkout"
            className="block text-center bg-green-600 text-white py-2 rounded font-semibold"
          >
            Finalizar pedido
          </Link>
        </div>
      </div>
    </div>
  );
}