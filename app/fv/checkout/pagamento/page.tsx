"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/fv/_components/cart";

const TAXA_ENTREGA = 10;
const PIX_CODE =
  "00020101021226850014BR.GOV.BCB.PIX2563exemplo-pix-chave520400005303986540510.005802BR5925IA DROGARIAS6009SAO PAULO62070503***6304ABCD";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PagamentoPage() {
  const router = useRouter();
  const { items, subtotal, countItems, clear, endereco } = useCart();
  const total = countItems ? subtotal + TAXA_ENTREGA : 0;

  function copiarPix() {
    navigator.clipboard.writeText(PIX_CODE);
    alert("Código PIX copiado.");
  }

  function jaPaguei() {
    try {
      [
        "FV_CART_V1",
        "FV_ENDERECO_ENTREGA_V1",
        "cart_fv",
        "cart_farmacia_virtual",
        "cart_fv_virtual",
        "cart_iadrogarias_fv",
      ].forEach((k) => localStorage.removeItem(k));
    } catch {}

    clear();
    router.push("/fv");
  }

  if (!countItems) {
    return (
      <main className="min-h-screen bg-slate-100 p-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border p-6 text-center">
          <h1 className="font-black text-xl">Carrinho vazio</h1>
          <Link href="/fv" className="mt-4 inline-block bg-blue-700 text-white px-5 py-3 rounded-xl font-bold">
            Voltar para loja
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-black mb-4">Pagamento</h1>

        <div className="grid md:grid-cols-[1fr_320px] gap-4">
          <section className="space-y-4">
            <div className="bg-white rounded-2xl border p-4">
              <h2 className="font-black mb-2">Entrega</h2>
              <p className="text-sm font-bold">
                {endereco?.endereco}, {endereco?.numero} — {endereco?.bairro}
              </p>
              <p className="text-xs text-slate-500">Entrega programada em até 24h</p>
            </div>

            <div className="bg-white rounded-2xl border p-4">
              <h2 className="font-black mb-3">Escolha o pagamento</h2>

              <div className="border-2 border-blue-600 rounded-2xl p-4 bg-blue-50">
                <p className="font-black text-blue-800">PIX</p>
                <p className="text-sm text-slate-600">Copie o código, pague no app do banco e clique em “Já paguei”.</p>

                <div className="mt-4 bg-white border rounded-xl p-3 font-mono text-xs break-all">
                  {PIX_CODE}
                </div>

                <button onClick={copiarPix} className="mt-3 w-full bg-slate-900 text-white rounded-xl py-3 font-black">
                  Copiar código PIX
                </button>

                <button onClick={jaPaguei} className="mt-3 w-full bg-green-600 text-white rounded-xl py-3 font-black">
                  ✅ Já paguei
                </button>

                <p className="text-xs text-slate-500 text-center mt-2">
                  Depois do pagamento, seu pedido será separado para entrega.
                </p>
              </div>
            </div>
          </section>

          <aside className="bg-white rounded-2xl border p-4 h-fit">
            <h2 className="font-black mb-3">Resumo final</h2>

            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.ean} className="flex justify-between gap-2">
                  <span>{item.qtd}x {item.nome}</span>
                  <b>{brl(item.preco * item.qtd)}</b>
                </div>
              ))}

              <div className="border-t pt-2 flex justify-between"><span>Subtotal</span><b>{brl(subtotal)}</b></div>
              <div className="flex justify-between"><span>Entrega</span><b>{brl(TAXA_ENTREGA)}</b></div>
              <div className="border-t pt-2 flex justify-between text-lg">
                <span className="font-black">Total</span>
                <b className="text-green-700">{brl(total)}</b>
              </div>
            </div>

            <Link href="/fv/checkout/identificacao" className="mt-4 block text-center text-sm font-bold text-slate-500">
              Voltar para entrega
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}