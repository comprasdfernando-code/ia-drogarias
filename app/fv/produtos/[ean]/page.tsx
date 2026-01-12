"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

import { CartProvider, useCart } from "../../_components/cart";
import { ToastProvider, useToast } from "../../_components/toast";

const LS_OPEN_CART = "fv_open_cart";

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

/* ✅ WRAPPER GARANTINDO PROVIDERS NA ROTA /fv/produtos/[ean] */
export default function FVProdutoPageWrapper() {
  return (
    <CartProvider>
      <ToastProvider>
        <FVProdutoPage />
      </ToastProvider>
    </CartProvider>
  );
}

function FVProdutoPage() {
  const params = useParams<{ ean: string }>();
  const router = useRouter();
  const { push } = useToast();
  const cart = useCart();

  const ean = decodeURIComponent(params.ean || "");

  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<FVProduto | null>(null);
  const [qtd, setQtd] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("fv_produtos")
          .select("id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,imagens,ativo")
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

  const precoFinal = useMemo(() => {
    if (!p) return null;
    if (p.em_promocao && p.preco_promocional && Number(p.preco_promocional) > 0) return Number(p.preco_promocional);
    return p.pmc != null ? Number(p.pmc) : null;
  }, [p]);

  function adicionar(abrirCarrinho: boolean) {
    if (!p) return;

    const price = Number(precoFinal || 0);
    if (!price) {
      push({ title: "Preço indisponível", desc: "Não foi possível adicionar este item." });
      return;
    }

    const q = Math.max(1, Math.floor(Number(qtd || 1)));

    cart.addItem(
      {
        ean: p.ean,
        nome: p.nome,
        laboratorio: p.laboratorio,
        apresentacao: p.apresentacao,
        imagem: firstImg(p.imagens),
        preco: price,
      },
      q
    );

    push({ title: "Adicionado ✅", desc: `${p.nome} • ${q}x` });
    setQtd(1);

    // ✅ "Comprar" = abre carrinho no /fv/produtos
    if (abrirCarrinho) {
      localStorage.setItem(LS_OPEN_CART, "1");
      router.push("/fv/produtos");
    }
  }

  if (loading) return <div className="p-6 text-gray-600">Carregando…</div>;

  if (!p) {
    return (
      <div className="p-6">
        <Link href="/fv/produtos" className="text-blue-700 underline">
          ← Voltar
        </Link>
        <p className="mt-4 text-gray-600">Produto não encontrado.</p>
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link href="/fv/produtos" className="text-sm text-blue-700 underline">
          ← Voltar
        </Link>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Imagem */}
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="relative">
              <Image src={firstImg(p.imagens)} alt={p.nome} width={520} height={520} className="w-full h-[280px] md:h-[420px] object-contain" />
              {p.em_promocao && p.percentual_off != null && p.percentual_off > 0 && (
                <span className="absolute top-3 right-3 bg-red-600 text-white text-sm px-3 py-1 rounded-full">
                  {p.percentual_off}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="text-sm text-gray-500">{p.laboratorio || "—"}</div>
            <h1 className="text-xl md:text-2xl font-bold text-blue-900 mt-1">{p.nome}</h1>

            <div className="mt-2 text-sm text-gray-600">
              <div>
                <b>EAN:</b> <span className="font-mono">{p.ean}</span>
              </div>
              {p.apresentacao && (
                <div>
                  <b>Apresentação:</b> {p.apresentacao}
                </div>
              )}
              {p.categoria && (
                <div>
                  <b>Categoria:</b> {p.categoria}
                </div>
              )}
            </div>

            <div className="mt-5 border-t pt-4">
              {p.em_promocao && p.preco_promocional ? (
                <>
                  <div className="text-sm text-gray-500">
                    De <span className="line-through">{brl(p.pmc)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-2xl font-extrabold text-blue-900">Por {brl(p.preco_promocional)}</div>
                    {p.percentual_off != null && p.percentual_off > 0 && (
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">{p.percentual_off}% off</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-2xl font-extrabold text-blue-900">{brl(p.pmc)}</div>
              )}

              <div className="text-xs text-gray-500 mt-2">
                Você adiciona no carrinho, preenche seus dados e só então finaliza no WhatsApp.
              </div>

              {/* Quantidade */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center border rounded-xl overflow-hidden">
                  <button onClick={() => setQtd((x) => Math.max(1, x - 1))} className="w-10 h-10 bg-white hover:bg-gray-50 font-extrabold">
                    –
                  </button>
                  <div className="w-12 text-center font-extrabold">{qtd}</div>
                  <button onClick={() => setQtd((x) => x + 1)} className="w-10 h-10 bg-white hover:bg-gray-50 font-extrabold">
                    +
                  </button>
                </div>
              </div>

              {/* ✅ 2 BOTÕES COMO VOCÊ PEDIU */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => adicionar(false)}
                  className="w-full bg-white border border-blue-700 text-blue-700 hover:bg-blue-50 py-3 rounded-xl font-extrabold"
                >
                  Adicionar ao carrinho
                </button>

                <button onClick={() => adicionar(true)} className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-extrabold">
                  Comprar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
