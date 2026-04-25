"use client";

import Link from "next/link";
import { useCart } from "./cart";
import { useCartUI } from "./cart-ui";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CartDrawer() {
  const { cartOpen, closeCart } = useCartUI();
  const { items, subtotal, countItems, inc, dec, remove, clear } = useCart();

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/55" onClick={closeCart} />

      <aside className="absolute right-0 top-0 h-full w-full max-w-[390px] bg-white shadow-2xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-black text-lg">🛒 Carrinho</h2>

          <button
            onClick={closeCart}
            className="rounded-xl bg-slate-100 px-3 py-2 font-bold"
          >
            Fechar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-10">
              <p className="font-bold text-slate-700">Seu carrinho está vazio</p>

              <button
                onClick={closeCart}
                className="mt-4 rounded-xl bg-blue-700 px-5 py-3 font-black text-white"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.ean} className="rounded-2xl border p-3">
                <p className="text-sm font-black">{item.nome}</p>
                <p className="text-xs text-slate-500">EAN: {item.ean}</p>

                <p className="mt-1 font-black text-blue-800">
                  {brl(item.preco)}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center overflow-hidden rounded-xl border">
                    <button
                      onClick={() => dec(item.ean)}
                      className="bg-slate-100 px-3 py-2 font-black"
                    >
                      −
                    </button>

                    <span className="px-4 font-black">{item.qtd}</span>

                    <button
                      onClick={() => inc(item.ean)}
                      className="bg-slate-100 px-3 py-2 font-black"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => remove(item.ean)}
                    className="text-sm font-bold text-red-600"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t bg-white p-4">
          <div className="flex justify-between text-sm">
            <span>Itens</span>
            <b>{countItems}</b>
          </div>

          <div className="mt-1 flex justify-between text-lg">
            <span className="font-black">Subtotal</span>
            <b className="text-blue-800">{brl(subtotal)}</b>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={clear}
              className="rounded-xl bg-slate-100 py-3 font-black"
            >
              Limpar
            </button>

            <Link
              href="/fv/carrinho"
              onClick={closeCart}
              className="rounded-xl bg-green-600 py-3 text-center font-black text-white"
            >
              Finalizar
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}