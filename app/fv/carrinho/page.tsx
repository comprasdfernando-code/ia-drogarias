"use client";

import Link from "next/link";
import { useCart } from "@/app/fv/_components/cart";

const TAXA_ENTREGA = 10;

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CarrinhoPage() {
  const { items, inc, dec, remove, clear, subtotal, countItems } = useCart();
  const total = countItems ? subtotal + TAXA_ENTREGA : 0;

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black">🛒 Carrinho</h1>
          <Link href="/fv" className="text-sm font-bold text-blue-700">
            Continuar comprando
          </Link>
        </div>

        <div className="grid md:grid-cols-[1fr_320px] gap-4">
          <section className="bg-white rounded-2xl border p-4">
            {items.length === 0 ? (
              <div className="text-center py-10">
                <p className="font-bold">Seu carrinho está vazio</p>
                <Link href="/fv" className="mt-4 inline-block bg-blue-700 text-white px-5 py-3 rounded-xl font-bold">
                  Ver produtos
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.ean} className="border rounded-xl p-3 flex justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm">{item.nome}</p>
                      <p className="text-xs text-slate-500">{item.laboratorio || item.apresentacao}</p>
                      <p className="font-black text-blue-800 mt-1">{brl(item.preco)}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center border rounded-lg overflow-hidden">
                        <button onClick={() => dec(item.ean)} className="px-3 py-1 bg-slate-100">−</button>
                        <span className="px-3 font-bold">{item.qtd}</span>
                        <button onClick={() => inc(item.ean)} className="px-3 py-1 bg-slate-100">+</button>
                      </div>
                      <button onClick={() => remove(item.ean)} className="text-xs text-red-600 font-bold">
                        Remover
                      </button>
                    </div>
                  </div>
                ))}

                <button onClick={clear} className="text-sm text-red-600 font-bold">
                  Limpar carrinho
                </button>
              </div>
            )}
          </section>

          <aside className="bg-white rounded-2xl border p-4 h-fit">
            <h2 className="font-black mb-3">Resumo do pedido</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <b>{brl(subtotal)}</b>
              </div>
              <div className="flex justify-between">
                <span>Taxa</span>
                <b>{countItems ? brl(TAXA_ENTREGA) : brl(0)}</b>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg">
                <span className="font-black">Total</span>
                <b className="text-green-700">{brl(total)}</b>
              </div>
            </div>

            <Link
              href="/fv/checkout/identificacao"
              className={`mt-4 block text-center rounded-xl py-3 font-black ${
                countItems ? "bg-green-600 text-white" : "bg-slate-200 text-slate-500 pointer-events-none"
              }`}
            >
              Continuar para entrega
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}