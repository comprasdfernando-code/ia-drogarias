"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "../../_components/cart";
import { ToastProvider, useToast } from "../../_components/toast";
import { CartUIProvider, useCartUI } from "../../_components/cart-ui";

/** Reusa helpers */
type FVProduto = {
  id: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  pmc: number | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  destaque_home: boolean | null;
  ativo: boolean | null;
  imagens: string[] | null;
};

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcOff(pmc?: number | null, promo?: number | null) {
  const a = Number(pmc || 0);
  const b = Number(promo || 0);
  if (!a || !b || b >= a) return 0;
  return Math.round(((a - b) / a) * 100);
}

function precoFinal(p: {
  pmc?: number | null;
  em_promocao?: boolean | null;
  preco_promocional?: number | null;
  percentual_off?: number | null;
}) {
  const pmc = Number(p.pmc || 0);
  const promo = Number(p.preco_promocional || 0);
  const emPromo = !!p.em_promocao && promo > 0 && (!pmc || promo < pmc);
  const final = emPromo ? promo : pmc;
  const offFromDb = Number(p.percentual_off || 0);
  const off = emPromo ? (offFromDb > 0 ? offFromDb : calcOff(pmc, promo)) : 0;
  return { emPromo, pmc, promo, final, off };
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0 && imagens[0]) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

export default function FVProdutoPageWrapper() {
  return (
    <ToastProvider>
      <CartUIProvider>
        <FVProdutoPage />
      </CartUIProvider>
    </ToastProvider>
  );
}

function FVProdutoPage() {
  const params = useParams<{ ean: string }>();
  const ean = String(params?.ean || "");

  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<FVProduto | null>(null);

  const [qtd, setQtd] = useState(1);

  const cart = useCart();
  const { push } = useToast();
  const { cartOpen, openCart, closeCart } = useCartUI();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("fv_produtos")
          .select("id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens")
          .eq("ean", ean)
          .eq("ativo", true)
          .maybeSingle();

        if (error) throw error;
        setP((data as FVProduto) ?? null);
      } catch (e) {
        console.error("Erro produto FV:", e);
        setP(null);
      } finally {
        setLoading(false);
      }
    }

    if (ean) load();
  }, [ean]);

  const pr = useMemo(() => (p ? precoFinal(p) : { emPromo: false, pmc: 0, promo: 0, final: 0, off: 0 }), [p]);

  function addToCart() {
    if (!p) return;
    const want = Math.max(1, qtd);

    cart.addItem(
      {
        ean: p.ean,
        nome: p.nome,
        laboratorio: p.laboratorio,
        apresentacao: p.apresentacao,
        imagem: firstImg(p.imagens),
        preco: pr.final || 0,
      },
      want
    );

    push({ title: "Adicionado ao carrinho ✅", desc: `${p.nome} • ${want}x` });
    setQtd(1);
  }

  function comprarAgora() {
    addToCart();
    openCart(); // ✅ abre carrinho (NÃO Whats)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white border rounded-3xl p-6">Carregando…</div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white border rounded-3xl p-6">
          <div className="font-extrabold text-lg">Produto não encontrado.</div>
          <Link className="text-blue-700 hover:underline" href="/fv">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-40 bg-blue-700 shadow">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/fv" className="text-white font-extrabold whitespace-nowrap">
            IA Drogarias <span className="opacity-80">• FV</span>
          </Link>

          <button
            type="button"
            onClick={openCart}
            className="relative text-white font-extrabold whitespace-nowrap bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full"
            title="Abrir carrinho"
          >
            🛒 {brl(cart.subtotal)}
            {cart.countItems > 0 && (
              <span className="absolute -top-2 -right-2 h-6 min-w-[24px] px-1 rounded-full bg-green-400 text-blue-900 text-xs font-extrabold flex items-center justify-center border-2 border-blue-700">
                {cart.countItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        <div className="bg-white border rounded-3xl p-5 md:p-7">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-center">
              <Image src={firstImg(p.imagens)} alt={p.nome} width={420} height={420} className="object-contain max-h-[260px]" />
            </div>

            <div>
              <div className="text-xs text-gray-500">{p.laboratorio || "—"}</div>
              <div className="text-xl md:text-2xl font-extrabold text-gray-900 mt-1">{p.nome}</div>
              {p.apresentacao ? <div className="text-sm text-gray-600 mt-2">{p.apresentacao}</div> : null}

              <div className="mt-4">
                {pr.emPromo ? (
                  <>
                    <div className="text-sm text-gray-500">
                      De <span className="line-through">{brl(pr.pmc)}</span>{" "}
                      {pr.off > 0 ? <span className="ml-2 text-red-600 font-extrabold">{pr.off}% OFF</span> : null}
                    </div>
                    <div className="text-2xl font-extrabold text-blue-900 mt-1">Por {brl(pr.final)}</div>
                  </>
                ) : (
                  <div className="text-2xl font-extrabold text-blue-900">{brl(pr.final)}</div>
                )}
              </div>

              <div className="mt-5 flex items-center gap-2">
                <div className="flex items-center border rounded-xl overflow-hidden">
                  <button type="button" onClick={() => setQtd((x) => Math.max(1, x - 1))} className="w-10 h-10 bg-white hover:bg-gray-50 font-extrabold">
                    –
                  </button>
                  <div className="w-12 text-center font-extrabold">{qtd}</div>
                  <button type="button" onClick={() => setQtd((x) => x + 1)} className="w-10 h-10 bg-white hover:bg-gray-50 font-extrabold">
                    +
                  </button>
                </div>
              </div>

              {/* ✅ 2 botões */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={addToCart}
                  className="w-full rounded-2xl border bg-white hover:bg-gray-50 py-3 font-extrabold"
                >
                  Adicionar ao carrinho
                </button>

                <button
                  type="button"
                  onClick={comprarAgora}
                  className="w-full rounded-2xl bg-blue-700 hover:bg-blue-800 text-white py-3 font-extrabold"
                >
                  Comprar
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500">EAN: {p.ean}</div>
            </div>
          </div>
        </div>
      </main>

      {/* ✅ reusa o mesmo carrinho da HOME (se você quiser, pode importar o CartModalPDV daqui também)
          Aqui, por simplicidade, ele abre o carrinho da HOME quando você está na HOME.
          Se você quer carrinho também aqui, o ideal é mover o CartModalPDV para um componente em /fv/_components e usar nos dois.
      */}
      {cartOpen ? (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/40" onClick={closeCart} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-lg">🛒 Carrinho</div>
              <button type="button" onClick={closeCart} className="px-3 py-2 rounded-xl border font-extrabold">
                Fechar
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Volte para a Home para finalizar o pedido (ou me pede que eu movo o CartModalPDV para componente e uso aqui também).
            </div>

            <Link href="/fv" className="mt-4 inline-block w-full text-center rounded-2xl bg-blue-700 hover:bg-blue-800 text-white py-3 font-extrabold">
              Ir para finalizar
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
