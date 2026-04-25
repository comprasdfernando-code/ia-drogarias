"use client";

import Link from "next/link";
import { useCart } from "./cart";
import { useCartUI } from "./cart-ui";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TAXA_ENTREGA = 10;

export default function CartDrawer() {
  const { cartOpen, closeCart } = useCartUI();
  const { items, subtotal, countItems, inc, dec, remove, clear } = useCart();

  const total = countItems ? subtotal + TAXA_ENTREGA : 0;

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/55" onClick={closeCart} />

      <aside className="absolute right-0 top-0 h-full w-full max-w-[390px] bg-white shadow-2xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-black text-lg">🛒 Carrinho</h2>
          <button
            onClick={closeCart}
            className="px-3 py-2 rounded-xl bg-slate-100 font-bold"
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
                className="mt-4 bg-blue-700 text-white px-5 py-3 rounded-xl font-black"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.ean} className="border rounded-2xl p-3">
                <p className="font-black text-sm">{item.nome}</p>
                <p className="text-xs text-slate-500">EAN: {item.ean}</p>
                <p className="font-black text-blue-800 mt-1">
                  {brl(item.preco)}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center border rounded-xl overflow-hidden">
                    <button onClick={() => dec(item.ean)} className="px-3 py-2 bg-slate-100">
                      −
                    </button>
                    <span className="px-4 font-black">{item.qtd}</span>
                    <button onClick={() => inc(item.ean)} className="px-3 py-2 bg-slate-100">
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => remove(item.ean)}
                    className="text-red-600 font-bold text-sm"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t p-4 bg-white">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <b>{brl(subtotal)}</b>
            </div>
            <div className="flex justify-between">
              <span>Taxa</span>
              <b>{countItems ? brl(TAXA_ENTREGA) : brl(0)}</b>
            </div>
            <div className="flex justify-between text-lg border-t pt-2">
              <span className="font-black">Total</span>
              <b className="text-green-700">{brl(total)}</b>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={clear}
              className="rounded-xl py-3 bg-slate-100 font-black"
            >
              Limpar
            </button>

            <Link
              href="/fv/carrinho"
              onClick={closeCart}
              className="rounded-xl py-3 bg-green-600 text-white font-black text-center"
            >
              Finalizar pedido
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}