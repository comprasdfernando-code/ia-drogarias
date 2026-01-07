"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

import CartDrawer from "../../_components/CartDrawer";
import { CartProvider, useCart } from "../../_components/cart";

const WHATSAPP = "5511948343725";
const TAXA_ENTREGA = 10;

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
  imagens: string[] | null;
  ativo: boolean | null;
};

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function calcOff(pmc?: number | null, promo?: number | null) {
  const a = Number(pmc || 0);
  const b = Number(promo || 0);
  if (!a || !b || b >= a) return 0;
  return Math.round(((a - b) / a) * 100);
}

function buildWhatsAppLink(numeroE164: string, msg: string) {
  const clean = numeroE164.replace(/\D/g, "");
  const text = encodeURIComponent(msg);
  return `https://wa.me/${clean}?text=${text}`;
}

export default function Page() {
  return (
    <CartProvider>
      <FVProdutoPage />
    </CartProvider>
  );
}

function FVProdutoPage() {
  const params = useParams<{ ean: string }>();
  const ean = decodeURIComponent(String(params?.ean || ""));

  const { addItem, countItems } = useCart();

  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<FVProduto | null>(null);

  useEffect(() => {
    async function load() {
      if (!ean) {
        setP(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("fv_produtos")
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,imagens,ativo"
          )
          .eq("ean", ean)
          .eq("ativo", true)
          .maybeSingle();

        if (error) throw error;
        setP((data as FVProduto) || null);
      } catch (e) {
        console.error(e);
        setP(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [ean]);

  const precos = useMemo(() => {
    if (!p) return null;

    const pmc = Number(p.pmc || 0);
    const promo = Number(p.preco_promocional || 0);
    const emPromo = !!p.em_promocao && promo > 0 && (!pmc || promo < pmc);
    const final = emPromo ? promo : pmc;

    const offFromDb = Number(p.percentual_off || 0);
    const off = emPromo ? (offFromDb > 0 ? offFromDb : calcOff(pmc, promo)) : 0;

    return { pmc, promo, emPromo, final, off };
  }, [p]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 pt-6 text-gray-600">Carregando…</div>
      </main>
    );
  }

  if (!p || !precos) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <Link href="/fv" className="text-blue-700 hover:underline">
            ← Voltar
          </Link>
          <div className="mt-6 bg-white border rounded-2xl p-6 text-gray-600">
            Produto não encontrado.
          </div>
        </div>
      </main>
    );
  }

  const msg = `Olá! Quero finalizar este pedido:
• Produto: ${p.nome}
• EAN: ${p.ean}
• Preço: ${brl(precos.final)}
• Entrega: taxa fixa ${brl(TAXA_ENTREGA)}

Pode confirmar a disponibilidade?`;

  function handleAdd() {
    addItem(
      {
        ean: p.ean,
        nome: p.nome,
        laboratorio: p.laboratorio,
        apresentacao: p.apresentacao,
        imagem: firstImg(p.imagens),
        preco: precos.final || 0,
      },
      1
    );
    setCartOpen(true);
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between">
          <Link href="/fv" className="text-sm text-blue-700 hover:underline">
            ← Voltar
          </Link>

          <button
            onClick={() => setCartOpen(true)}
            className="relative bg-white border rounded-2xl px-4 py-2 font-extrabold"
          >
            🛒 Carrinho
            {countItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center">
                {countItems}
              </span>
            )}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Imagem */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
            <div className="relative bg-gray-50 rounded-2xl p-3">
              <Image
                src={firstImg(p.imagens)}
                alt={p.nome}
                width={720}
                height={720}
                className="w-full h-[300px] md:h-[440px] object-contain"
              />

              {precos.emPromo && precos.off > 0 && (
                <span className="absolute top-4 right-4 bg-red-600 text-white text-sm px-3 py-1 rounded-full font-extrabold shadow-sm">
                  {precos.off}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
            <div className="inline-flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">
              <span className="font-semibold">{p.laboratorio || "—"}</span>
              <span className="text-gray-300">•</span>
              <span className="font-mono">{p.ean}</span>
            </div>

            <h1 className="text-xl md:text-3xl font-extrabold text-blue-950 mt-3 leading-tight">
              {p.nome}
            </h1>

            <div className="mt-3 grid grid-cols-1 gap-1 text-sm text-gray-700">
              {p.apresentacao && (
                <div className="flex gap-2">
                  <span className="text-gray-500">Apresentação:</span>
                  <span className="font-medium">{p.apresentacao}</span>
                </div>
              )}
              {p.categoria && (
                <div className="flex gap-2">
                  <span className="text-gray-500">Categoria:</span>
                  <span className="font-medium">{p.categoria}</span>
                </div>
              )}
            </div>

            {/* Preço */}
            <div className="mt-6 border-t pt-5">
              {precos.emPromo ? (
                <>
                  <div className="text-sm text-gray-500">
                    De <span className="line-through">{brl(precos.pmc)}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <div className="text-3xl font-extrabold text-blue-950">
                      Por {brl(precos.final)}
                    </div>

                    {precos.off > 0 && (
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
                        {precos.off}% off
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-3xl font-extrabold text-blue-950">
                  {brl(precos.final)}
                </div>
              )}

              <div className="mt-3 bg-blue-50 border border-blue-100 text-blue-900 rounded-2xl p-4">
                <p className="text-xs md:text-sm">
                  <span className="font-semibold">Finalização do pedido:</span>{" "}
                  analisamos a disponibilidade e retornamos em poucos minutos para confirmar.
                </p>
                <p className="text-xs md:text-sm mt-1 text-blue-900/80">
                  Entrega São Paulo capital • prazo até 24h • taxa fixa{" "}
                  <span className="font-bold">{brl(TAXA_ENTREGA)}</span>.
                </p>
              </div>

              {/* AÇÕES */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={handleAdd}
                  className="bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-2xl font-extrabold"
                >
                  Adicionar ao carrinho
                </button>

                <a
                  href={buildWhatsAppLink(WHATSAPP, msg)}
                  className="text-center bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-extrabold"
                >
                  Comprar agora
                </a>
              </div>

              <div className="mt-3 text-[11px] text-gray-500">
                Dica: adicione outros itens e finalize tudo junto no carrinho.
              </div>
            </div>
          </div>
        </div>
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        whatsapp={WHATSAPP}
        taxaEntrega={TAXA_ENTREGA}
      />
    </main>
  );
}
