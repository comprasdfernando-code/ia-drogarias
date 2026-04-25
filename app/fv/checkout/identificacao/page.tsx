"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/fv/_components/cart";

const TAXA_ENTREGA = 10;

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function IdentificacaoEntregaPage() {
  const router = useRouter();
  const { items, subtotal, countItems, endereco } = useCart();
  const total = countItems ? subtotal + TAXA_ENTREGA : 0;

  function continuar() {
    if (!countItems) {
      router.push("/fv/carrinho");
      return;
    }

    if (!endereco?.endereco || !endereco?.numero || !endereco?.bairro) {
      alert("Cadastre ou preencha um endereço de entrega antes de continuar.");
      return;
    }

    router.push("/fv/checkout/pagamento");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-black mb-4">Identificação e entrega</h1>

        <div className="grid md:grid-cols-[1fr_320px] gap-4">
          <section className="space-y-4">
            <div className="bg-white rounded-2xl border p-4">
              <h2 className="font-black mb-2">Endereço de entrega</h2>

              {endereco ? (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                  <p className="font-black">
                    {endereco.endereco}, {endereco.numero}
                  </p>
                  <p className="text-sm text-slate-600">
                    {endereco.bairro} — {endereco.cidade || "São Paulo"} / {endereco.estado || "SP"}
                  </p>
                  {endereco.complemento && <p className="text-sm">Complemento: {endereco.complemento}</p>}
                  {endereco.referencia && <p className="text-sm">Referência: {endereco.referencia}</p>}
                </div>
              ) : (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700 font-bold">
                  Nenhum endereço principal encontrado.
                </div>
              )}

              <Link href="/fv/minha-conta" className="mt-3 inline-block text-sm font-bold text-blue-700">
                Trocar ou cadastrar endereço
              </Link>
            </div>

            <div className="bg-white rounded-2xl border p-4">
              <h2 className="font-black mb-2">Forma de entrega</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="border-2 border-blue-600 bg-blue-50 rounded-xl p-3">
                  <p className="font-black text-blue-800">Entrega</p>
                  <p className="text-xs text-slate-600">Pedido programado em até 24h</p>
                </div>
                <div className="border rounded-xl p-3 opacity-60">
                  <p className="font-black">Retirada</p>
                  <p className="text-xs text-slate-600">Em breve</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="bg-white rounded-2xl border p-4 h-fit">
            <h2 className="font-black mb-3">Resumo</h2>
            <p className="text-sm mb-3">{countItems} item(ns)</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><b>{brl(subtotal)}</b></div>
              <div className="flex justify-between"><span>Entrega</span><b>{brl(TAXA_ENTREGA)}</b></div>
              <div className="border-t pt-2 flex justify-between text-lg">
                <span className="font-black">Total</span>
                <b className="text-green-700">{brl(total)}</b>
              </div>
            </div>

            <button onClick={continuar} className="mt-4 w-full bg-green-600 text-white rounded-xl py-3 font-black">
              Ir para pagamento
            </button>

            <Link href="/fv/carrinho" className="mt-3 block text-center text-sm font-bold text-slate-500">
              Voltar ao carrinho
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}