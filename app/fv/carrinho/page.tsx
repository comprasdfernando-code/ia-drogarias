"use client";

import Link from "next/link";
import { useCart } from "@/app/fv/_components/cart";

const TAXA_ENTREGA = 10;

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CarrinhoPage() {
  const { items, inc, dec, remove, clear, subtotal, countItems, endereco } =
    useCart();

  const total = countItems ? subtotal + TAXA_ENTREGA : 0;

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-black">🛒 Carrinho</h1>

          <Link href="/fv" className="text-sm font-bold text-blue-700">
            Continuar comprando
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <section className="space-y-4">
            <div className="rounded-2xl border bg-white p-4">
              <h2 className="mb-3 font-black">Produtos</h2>

              {items.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="font-bold">Seu carrinho está vazio</p>

                  <Link
                    href="/fv"
                    className="mt-4 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
                  >
                    Ver produtos
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.ean}
                      className="flex justify-between gap-3 rounded-xl border p-3"
                    >
                      <div>
                        <p className="text-sm font-bold">{item.nome}</p>

                        <p className="text-xs text-slate-500">
                          {item.laboratorio || item.apresentacao || `EAN: ${item.ean}`}
                        </p>

                        <p className="mt-1 font-black text-blue-800">
                          {brl(item.preco)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center overflow-hidden rounded-lg border">
                          <button
                            onClick={() => dec(item.ean)}
                            className="bg-slate-100 px-3 py-1 font-black"
                          >
                            −
                          </button>

                          <span className="px-3 font-bold">{item.qtd}</span>

                          <button
                            onClick={() => inc(item.ean)}
                            className="bg-slate-100 px-3 py-1 font-black"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => remove(item.ean)}
                          className="text-xs font-bold text-red-600"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={clear}
                    className="text-sm font-bold text-red-600"
                  >
                    Limpar carrinho
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <h2 className="mb-3 font-black">Endereço de entrega</h2>

              {endereco ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <p className="font-black">
                    {endereco.endereco}, {endereco.numero}
                  </p>

                  <p className="text-sm text-slate-600">
                    {endereco.bairro} — {endereco.cidade || "São Paulo"} /{" "}
                    {endereco.estado || "SP"}
                  </p>

                  {endereco.cep && (
                    <p className="text-sm text-slate-600">CEP: {endereco.cep}</p>
                  )}

                  {endereco.complemento && (
                    <p className="text-sm text-slate-600">
                      Complemento: {endereco.complemento}
                    </p>
                  )}

                  {endereco.referencia && (
                    <p className="text-sm text-slate-600">
                      Referência: {endereco.referencia}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">
                  Nenhum endereço salvo. Cadastre um endereço na sua conta.
                </div>
              )}

              <Link
                href="/fv/conta"
                className="mt-3 inline-block text-sm font-bold text-blue-700"
              >
                Trocar ou cadastrar endereço
              </Link>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <h2 className="mb-3 font-black">Pagamento</h2>

              <div className="rounded-xl border-2 border-blue-600 bg-blue-50 p-3">
                <p className="font-black text-blue-800">PIX</p>
                <p className="text-xs text-slate-600">
                  Forma de pagamento padrão para finalizar agora.
                </p>
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-2xl border bg-white p-4">
            <h2 className="mb-3 font-black">Resumo do pedido</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Itens</span>
                <b>{countItems}</b>
              </div>

              <div className="flex justify-between">
                <span>Subtotal</span>
                <b>{brl(subtotal)}</b>
              </div>

              <div className="flex justify-between">
                <span>Entrega</span>
                <b>{countItems ? brl(TAXA_ENTREGA) : brl(0)}</b>
              </div>

              <div className="flex justify-between border-t pt-2 text-lg">
                <span className="font-black">Total</span>
                <b className="text-green-700">{brl(total)}</b>
              </div>
            </div>

            <Link
              href="/fv/checkout/pagamento"
              className={`mt-4 block rounded-xl py-3 text-center font-black ${
                countItems && endereco
                  ? "bg-green-600 text-white"
                  : "pointer-events-none bg-slate-200 text-slate-500"
              }`}
            >
              Finalizar e pagar
            </Link>

            {!endereco && countItems > 0 && (
              <p className="mt-2 text-center text-xs font-bold text-red-600">
                Cadastre um endereço antes de pagar.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}