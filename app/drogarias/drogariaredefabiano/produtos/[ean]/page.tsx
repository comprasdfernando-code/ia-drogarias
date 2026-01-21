"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// ✅ usa o MESMO carrinho/toast da HOME
import { useCart } from "../../_components/cart"; // ajuste o caminho se necessário
import { useToast } from "../../_components/toast"; // ajuste o caminho se necessário

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FARMACIA_SLUG = "drogariaredefabiano";
const VIEW = "fv_produtos_loja_view";

type ProdutoRow = {
  farmacia_slug: string;
  produto_id: string;
  ean: string | null;
  nome: string | null;
  laboratorio: string | null;
  categoria: string | null;
  apresentacao: string | null;
  imagens: any | null;

  disponivel_farmacia: boolean | null;
  estoque: number | null;
  preco_venda: number | null;

  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  destaque_home: boolean | null;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizeImgs(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}
  }
  return [];
}

function firstImg(v: any) {
  const arr = normalizeImgs(v);
  return arr[0] || "/produtos/caixa-padrao.png";
}

function getFinalPrice(p: ProdutoRow) {
  const venda = p.preco_venda ?? null;
  const promo = p.preco_promocional ?? null;
  const emPromo = !!p.em_promocao;
  if (emPromo && promo != null && promo > 0) return promo;
  if (venda != null && venda > 0) return venda;
  return 0;
}

export default function ProdutoPorEANPage() {
  const params = useParams();
  const router = useRouter();

  const cart = useCart();
  const { push } = useToast();

  const eanParam = useMemo(() => {
    const raw = (params as any)?.ean ?? "";
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const ean = useMemo(() => onlyDigits(String(eanParam || "")), [eanParam]);

  const [loading, setLoading] = useState(true);
  const [produto, setProduto] = useState<ProdutoRow | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [imgIdx, setImgIdx] = useState(0);
  const imgs = useMemo(() => (produto ? normalizeImgs(produto.imagens) : []), [produto]);

  const [qtd, setQtd] = useState(1);

  async function carregarProduto() {
    try {
      setLoading(true);
      setErr(null);
      setProduto(null);

      if (!ean || ean.length < 6) {
        setErr("EAN inválido.");
        return;
      }

      const { data, error } = await supabase
        .from(VIEW)
        .select(
          `
          farmacia_slug,
          produto_id,
          ean,
          nome,
          laboratorio,
          categoria,
          apresentacao,
          imagens,
          disponivel_farmacia,
          estoque,
          preco_venda,
          em_promocao,
          preco_promocional,
          percentual_off,
          destaque_home
        `
        )
        .eq("farmacia_slug", FARMACIA_SLUG)
        .eq("ean", ean)
        .limit(1);

      if (error) throw error;

      const p = (data?.[0] as ProdutoRow) || null;
      if (!p) {
        setErr("Produto não encontrado.");
        return;
      }

      setProduto(p);
      setImgIdx(0);
      setQtd(1);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Erro ao carregar produto.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProduto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ean]);

  const ativo = !!produto?.disponivel_farmacia;
  const estoque = Math.max(0, Number(produto?.estoque || 0));
  const finalPrice = produto ? getFinalPrice(produto) : 0;

  function addToCart(openCart = false) {
    if (!produto) return;

    if (!ativo) {
      push({ title: "Indisponível", desc: "Produto inativo na loja." });
      return;
    }
    if (estoque <= 0) {
      push({ title: "Sem estoque", desc: "Produto sem estoque no momento." });
      return;
    }

    const want = Math.max(1, Number(qtd || 1));
    const already = cart.items.find((x) => x.ean === (produto.ean || ean))?.qtd ?? 0;

    // trava pelo estoque
    if (already + want > estoque) {
      const canAdd = Math.max(0, estoque - already);
      if (canAdd <= 0) {
        push({ title: "Sem estoque 😕", desc: "Você já atingiu o limite disponível." });
        return;
      }

      cart.addItem(
        {
          ean: produto.ean || ean,
          nome: produto.nome || "Produto",
          laboratorio: produto.laboratorio,
          apresentacao: produto.apresentacao,
          imagem: firstImg(produto.imagens),
          preco: finalPrice || 0,
        },
        canAdd
      );

      push({ title: "Adicionado ✅", desc: `${produto.nome} • ${canAdd}x (limite do estoque)` });
      setQtd(1);

      if (openCart) router.push(`/drogarias/${FARMACIA_SLUG}?openCart=1`);
      return;
    }

    cart.addItem(
      {
        ean: produto.ean || ean,
        nome: produto.nome || "Produto",
        laboratorio: produto.laboratorio,
        apresentacao: produto.apresentacao,
        imagem: firstImg(produto.imagens),
        preco: finalPrice || 0,
      },
      want
    );

    push({ title: "Adicionado ✅", desc: `${produto.nome} • ${want}x` });
    setQtd(1);

    if (openCart) router.push(`/drogarias/${FARMACIA_SLUG}?openCart=1`);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/drogarias/${FARMACIA_SLUG}`} className="text-sm font-semibold text-blue-700 hover:underline">
            ← Voltar para a loja
          </Link>

          <Link
            href={`/drogarias/${FARMACIA_SLUG}?openCart=1`}
            className="text-sm font-semibold px-3 py-2 rounded-xl border bg-white hover:bg-gray-50"
          >
            🛒 Ver carrinho
          </Link>
        </div>

        {loading && (
          <div className="mt-6 bg-white border rounded-2xl p-6 shadow-sm text-gray-700">
            Carregando produto...
          </div>
        )}

        {!loading && err && (
          <div className="mt-6 bg-white border rounded-2xl p-6 shadow-sm">
            <div className="text-lg font-bold text-red-700">⚠️ {err}</div>
            <div className="text-sm text-gray-600 mt-2">
              EAN: <b>{eanParam as any}</b>
            </div>
          </div>
        )}

        {!loading && produto && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border rounded-2xl shadow-sm p-4">
              <div className="w-full h-[360px] bg-gray-50 border rounded-2xl flex items-center justify-center overflow-hidden">
                <Image
                  src={imgs[imgIdx] || firstImg(produto.imagens)}
                  alt={produto.nome || "Produto"}
                  width={900}
                  height={900}
                  className="object-contain"
                />
              </div>

              {imgs.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {imgs.map((u, i) => (
                    <button
                      key={u + i}
                      onClick={() => setImgIdx(i)}
                      className={`border rounded-xl w-16 h-16 bg-white overflow-hidden flex items-center justify-center ${
                        i === imgIdx ? "ring-2 ring-blue-500" : "hover:bg-gray-50"
                      }`}
                      title={`Imagem ${i + 1}`}
                    >
                      <Image src={u} alt={`thumb-${i}`} width={64} height={64} className="object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border rounded-2xl shadow-sm p-5">
              <div className="text-xs text-gray-500">
                {produto.categoria || "Sem categoria"} • EAN: <b>{produto.ean || "—"}</b>
              </div>

              <h1 className="mt-2 text-2xl font-bold text-gray-900">{produto.nome || "—"}</h1>

              <div className="mt-1 text-sm text-gray-600">
                {produto.laboratorio || "—"}
                {produto.apresentacao ? ` • ${produto.apresentacao}` : ""}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  {produto.em_promocao && produto.preco_promocional != null ? (
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-extrabold text-emerald-700">
                        {brl(produto.preco_promocional)}
                      </div>
                      {produto.preco_venda != null && (
                        <div className="text-sm text-gray-500 line-through">{brl(produto.preco_venda)}</div>
                      )}
                      {produto.percentual_off != null && (
                        <span className="text-xs px-2 py-1 rounded-full border bg-emerald-50 text-emerald-800">
                          {Number(produto.percentual_off).toFixed(0)}% OFF
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-3xl font-extrabold text-blue-700">
                      {produto.preco_venda != null ? brl(produto.preco_venda) : "Consulte"}
                    </div>
                  )}

                  <div className="mt-1 text-xs text-gray-500">
                    {ativo ? (
                      estoque > 0 ? (
                        <>
                          <b className="text-emerald-700">Em estoque</b> • {estoque} un.
                        </>
                      ) : (
                        <b className="text-red-700">Sem estoque</b>
                      )
                    ) : (
                      <b className="text-gray-500">Inativo na loja</b>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQtd((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl border bg-white hover:bg-gray-50 font-bold"
                  >
                    −
                  </button>
                  <input
                    value={qtd}
                    onChange={(e) => setQtd(Math.max(1, Number(e.target.value || 1)))}
                    type="number"
                    min={1}
                    className="w-16 h-10 rounded-xl border text-center"
                  />
                  <button
                    onClick={() => setQtd((q) => q + 1)}
                    className="w-10 h-10 rounded-xl border bg-white hover:bg-gray-50 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => addToCart(false)}
                  disabled={!ativo || estoque <= 0}
                  className={`px-4 py-3 rounded-2xl font-semibold border ${
                    !ativo || estoque <= 0 ? "bg-gray-100 text-gray-400" : "bg-white hover:bg-gray-50 text-gray-900"
                  }`}
                >
                  🧺 Adicionar ao carrinho
                </button>

                <button
                  onClick={() => addToCart(true)}
                  disabled={!ativo || estoque <= 0}
                  className={`px-4 py-3 rounded-2xl font-semibold text-white ${
                    !ativo || estoque <= 0 ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  🛒 Comprar (abrir carrinho)
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Dica: se quiser, eu já deixo essa página puxando “produtos relacionados” da mesma categoria.
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
