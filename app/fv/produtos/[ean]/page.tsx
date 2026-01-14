"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "../../_components/cart";
import { ToastProvider, useToast } from "../../_components/toast";
import { CartUIProvider, useCartUI } from "../../_components/cart-ui";

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
  const { openCart } = useCartUI();

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
        console.error("Erro load produto:", e);
        setP(null);
      } finally {
        setLoading(false);
      }
    }

    if (ean) load();
  }, [ean]);

  const pr = useMemo(() => (p ? precoFinal(p) : { emPromo: false, pmc: 0, promo: 0, final: 0, off: 0 }), [p]);

  function addOnly() {
    if (!p) return;

    cart.addItem(
      {
        ean: p.ean,
        nome: p.nome,
        laboratorio: p.laboratorio,
        apresentacao: p.apresentacao,
        imagem: firstImg(p.imagens),
        preco: pr.final || 0,
      },
      qtd
    );

    push({ title: "Adicionado ao carrinho ✅", desc: `${p.nome} • ${qtd}x` });
  }

  function buyOpenCart() {
    addOnly();
    openCart(); // ✅ AQUI: compra abre o carrinho (SEM WHATS)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white border rounded-3xl p-6">Carregando…</div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white border rounded-3xl p-6">
          Produto não encontrado.
          <div className="mt-4">
            <Link className="text-blue-700 font-extrabold hover:underline" href="/fv">
              ← Voltar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Link href="/fv" className="text-blue-700 font-extrabold hover:underline">
          ← Voltar
        </Link>

        <div className="mt-4 bg-white border rounded-3xl shadow-sm p-5 grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-center">
            <Image src={firstImg(p.imagens)} alt={p.nome} width={520} height={520} className="object-contain max-h-[320px]" />
          </div>

          <div>
            <div className="text-xs text-gray-500">{p.laboratorio || "—"}</div>
            <h1 className="mt-1 text-xl md:text-2xl font-extrabold text-gray-900">{p.nome}</h1>
            {p.apresentacao ? <div className="mt-1 text-sm text-gray-600">{p.apresentacao}</div> : null}

            <div className="mt-4">
              {pr.emPromo ? (
                <>
                  <div className="text-sm text-gray-500">
                    De <span className="line-through">{brl(pr.pmc)}</span>{" "}
                    {pr.off > 0 ? <span className="ml-2 text-red-600 font-extrabold">{pr.off}% OFF</span> : null}
                  </div>
                  <div className="text-2xl font-extrabold text-blue-900">Por {brl(pr.final)}</div>
                </>
              ) : (
                <div className="text-2xl font-extrabold text-blue-900">{brl(pr.final)}</div>
              )}
            </div>

            <div className="mt-5 flex items-center gap-2">
              <div className="flex items-center border rounded-xl overflow-hidden">
                <button onClick={() => setQtd((x) => Math.max(1, x - 1))} className="w-11 h-11 bg-white hover:bg-gray-50 font-extrabold">
                  –
                </button>
                <div className="w-12 text-center font-extrabold">{qtd}</div>
                <button onClick={() => setQtd((x) => x + 1)} className="w-11 h-11 bg-white hover:bg-gray-50 font-extrabold">
                  +
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={addOnly} className="w-full rounded-2xl border bg-white hover:bg-gray-50 py-3 font-extrabold">
                Adicionar
              </button>

              <button onClick={buyOpenCart} className="w-full rounded-2xl bg-blue-700 hover:bg-blue-800 text-white py-3 font-extrabold">
                Comprar
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-500">Comprar abre o carrinho (não abre WhatsApp).</div>
          </div>
        </div>
      </div>
    </div>
  );
}
