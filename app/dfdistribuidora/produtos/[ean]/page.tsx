// app/dfdistribuidora/produtos/[ean]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { CartProvider, useCart } from "../../_components/cart";
import { ToastProvider, useToast } from "../../_components/toast";

/* =========================
   CONFIG
========================= */
type DFProduto = {
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
  ativo: boolean | null;
  imagens: string[] | null;
  estoque: number | null;
};

const PROD_TABLE = "df_produtos";
const PREFIX = "/dfdistribuidora";
const WHATS_DF = "5511952068432";

/* =========================
   HELPERS
========================= */
function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens.length > 0 && imagens[0]) return imagens[0];
  return "/produtos/caixa-padrao.png";
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

function waLink(phone: string, msg: string) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

/* =========================
   PAGE WRAPPER
========================= */
export default function DFProdutoPageWrapper() {
  return (
    <CartProvider>
      <ToastProvider>
        <DFProdutoPage />
      </ToastProvider>
    </CartProvider>
  );
}

/* =========================
   PAGE
========================= */
function DFProdutoPage() {
  const params = useParams<{ ean: string }>();
  const eanRaw = params?.ean ? decodeURIComponent(String(params.ean)) : "";

  const [loading, setLoading] = useState(true);
  const [produto, setProduto] = useState<DFProduto | null>(null);

  const [qtd, setQtd] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);

  const cart = useCart();
  const { push } = useToast();

  const qtdCarrinho = cart.countItems;
  const totalCarrinho = cart.subtotal;

  const estoqueAtual = Number(produto?.estoque ?? 0);
  const indisponivel = !produto || estoqueAtual <= 0 || produto.ativo === false;

  const pr = useMemo(() => (produto ? precoFinal(produto) : { emPromo: false, pmc: 0, promo: 0, final: 0, off: 0 }), [produto]);

  // mapa de estoque só desse item (pra trava do modal)
  const estoqueByEan = useMemo(() => {
    const m = new Map<string, number>();
    if (produto?.ean) m.set(produto.ean, estoqueAtual);
    return m;
  }, [produto?.ean, estoqueAtual]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setProduto(null);

      try {
        const digits = (eanRaw || "").replace(/\D/g, "");
        if (!digits) {
          setProduto(null);
          return;
        }

        const { data, error } = await supabase
          .from(PROD_TABLE)
          .select("id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,ativo,imagens,estoque")
          .eq("ean", digits)
          .single();

        if (error) throw error;
        setProduto((data as DFProduto) ?? null);
      } catch (e) {
        console.error("Erro load produto DF:", e);
        setProduto(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [eanRaw]);

  const whatsappMsg = useMemo(() => {
    if (!produto) return "Olá! Quero um orçamento na DF Distribuidora.";
    const linhas = [
      `Olá! Quero este item:`,
      ``,
      `• ${produto.nome}`,
      `• EAN: ${produto.ean}`,
      produto.apresentacao ? `• Apresentação: ${produto.apresentacao}` : null,
      produto.laboratorio ? `• Laboratório: ${produto.laboratorio}` : null,
      ``,
      `Pode confirmar disponibilidade e prazo?`,
    ].filter(Boolean) as string[];

    return linhas.join("\n");
  }, [produto]);

  function addToCart() {
    if (!produto) return;
    if (indisponivel) {
      push({ title: "Indisponível 😕", desc: "Sem estoque no momento." });
      return;
    }

    const want = Math.max(1, Math.floor(Number(qtd || 1)));
    const already = cart.items.find((x) => x.ean === produto.ean)?.qtd ?? 0;

    if (estoqueAtual > 0 && already + want > estoqueAtual) {
      const canAdd = Math.max(0, estoqueAtual - already);
      if (canAdd <= 0) {
        push({ title: "Sem estoque 😕", desc: "Você já atingiu o limite disponível." });
        return;
      }

      cart.addItem(
        {
          ean: produto.ean,
          nome: produto.nome,
          laboratorio: produto.laboratorio,
          apresentacao: produto.apresentacao,
          imagem: firstImg(produto.imagens),
          preco: pr.final || 0,
        },
        canAdd
      );

      push({ title: "Adicionado ✅", desc: `${canAdd}x (limite do estoque)` });
      setQtd(1);
      return;
    }

    cart.addItem(
      {
        ean: produto.ean,
        nome: produto.nome,
        laboratorio: produto.laboratorio,
        apresentacao: produto.apresentacao,
        imagem: firstImg(produto.imagens),
        preco: pr.final || 0,
      },
      want
    );

    push({ title: "Adicionado ✅", desc: `${want}x no carrinho` });
    setQtd(1);
  }

  function comprarAbrirCarrinho() {
    // comportamento típico: se não tiver no carrinho, adiciona 1 e abre
    if (!produto) return;
    if (!indisponivel) {
      const already = cart.items.find((x) => x.ean === produto.ean)?.qtd ?? 0;
      if (already === 0) {
        // adiciona 1
        cart.addItem(
          {
            ean: produto.ean,
            nome: produto.nome,
            laboratorio: produto.laboratorio,
            apresentacao: produto.apresentacao,
            imagem: firstImg(produto.imagens),
            preco: pr.final || 0,
          },
          1
        );
      }
      setCartOpen(true);
      return;
    }

    push({ title: "Indisponível 😕", desc: "Sem estoque no momento." });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-14 text-gray-600">Carregando produto…</div>
      </main>
    );
  }

  if (!produto) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="bg-white border rounded-2xl p-6">
            <div className="text-red-600 font-extrabold">Produto não encontrado 😕</div>
            <div className="text-gray-600 mt-2">Verifique o EAN e tente novamente.</div>
            <div className="mt-4">
              <Link className="px-4 py-2 rounded-xl bg-blue-700 text-white font-extrabold" href={PREFIX}>
                Voltar para a loja
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={PREFIX} className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold">
            ← Voltar
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setCartOpen(true)}
              className="relative px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold"
              title="Abrir carrinho"
            >
              🛒 {brl(totalCarrinho)}
              {qtdCarrinho > 0 && (
                <span className="absolute -top-2 -right-2 h-6 min-w-[24px] px-1 rounded-full bg-green-400 text-blue-900 text-xs font-extrabold flex items-center justify-center border-2 border-white">
                  {qtdCarrinho}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white border rounded-3xl shadow-sm p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* imagem */}
            <div className="bg-gray-50 rounded-3xl p-6 flex items-center justify-center">
              <Image
                src={firstImg(produto.imagens)}
                alt={produto.nome}
                width={420}
                height={420}
                className="object-contain max-h-[380px]"
              />
            </div>

            {/* infos */}
            <div>
              <div className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">
                {produto.laboratorio || "—"}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-blue-950 mt-1">{produto.nome}</h1>

              {produto.apresentacao ? (
                <div className="text-gray-600 mt-1">{produto.apresentacao}</div>
              ) : null}

              <div className="mt-5">
                {pr.emPromo ? (
                  <>
                    <div className="text-sm text-gray-500">
                      De <span className="line-through">{brl(pr.pmc)}</span>{" "}
                      {pr.off > 0 ? (
                        <span className="ml-2 inline-block bg-red-600 text-white text-xs font-extrabold px-2 py-1 rounded-full">
                          {pr.off}% OFF
                        </span>
                      ) : null}
                    </div>
                    <div className="text-3xl font-extrabold text-blue-900 mt-1">Por {brl(pr.final)}</div>
                  </>
                ) : (
                  <div className="text-3xl font-extrabold text-blue-900">{brl(pr.final)}</div>
                )}
              </div>

              <div className="mt-4 text-sm text-gray-700">
                {indisponivel ? (
                  <span className="font-extrabold text-gray-500">Sem estoque</span>
                ) : (
                  <span>
                    Estoque disponível: <b>{estoqueAtual}</b>
                  </span>
                )}
              </div>

              {/* qty + botões */}
              <div className="mt-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-2xl overflow-hidden bg-white">
                    <button
                      onClick={() => setQtd((x) => Math.max(1, x - 1))}
                      className="w-12 h-11 font-extrabold hover:bg-gray-50"
                      disabled={indisponivel}
                    >
                      –
                    </button>
                    <div className="w-14 text-center font-extrabold">{qtd}</div>
                    <button
                      onClick={() => setQtd((x) => x + 1)}
                      className="w-12 h-11 font-extrabold hover:bg-gray-50"
                      disabled={indisponivel}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={addToCart}
                    disabled={indisponivel}
                    className={`flex-1 h-11 rounded-2xl font-extrabold ${
                      indisponivel ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    Adicionar ao carrinho
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* ✅ Comprar abre carrinho */}
                  <button
                    onClick={comprarAbrirCarrinho}
                    className={`h-12 rounded-2xl font-extrabold ${
                      indisponivel ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800 text-white"
                    }`}
                    disabled={indisponivel}
                    title="Abrir carrinho"
                  >
                    Comprar (abrir carrinho)
                  </button>

                  {/* WhatsApp secundário */}
                  <a
                    href={waLink(WHATS_DF, whatsappMsg)}
                    target="_blank"
                    rel="noreferrer"
                    className="h-12 rounded-2xl font-extrabold border bg-white hover:bg-gray-50 text-center flex items-center justify-center"
                    title="Falar no WhatsApp"
                  >
                    💬 Falar no WhatsApp
                  </a>
                </div>

                <Link
                  href={PREFIX}
                  className="h-12 rounded-2xl font-extrabold border bg-white hover:bg-gray-50 text-center flex items-center justify-center"
                >
                  Continuar comprando
                </Link>
              </div>

              <div className="mt-5 text-xs text-gray-500">
                EAN: <b>{produto.ean}</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ MODAL DO CARRINHO */}
      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} whats={WHATS_DF} estoqueByEan={estoqueByEan} />
    </main>
  );
}

/* =========================
   CART MODAL
========================= */
function CartModal({
  open,
  onClose,
  whats,
  estoqueByEan,
}: {
  open: boolean;
  onClose: () => void;
  whats: string;
  estoqueByEan: Map<string, number>;
}) {
  const cart = useCart();

  function incSafe(ean: string) {
    const est = Number(estoqueByEan.get(ean) ?? 0);
    const it = cart.items.find((x) => x.ean === ean);
    if (!it) return;
    if (est > 0 && it.qtd >= est) return;
    cart.inc(ean);
  }

  function setQtdSafe(ean: string, qtd: number) {
    const est = Number(estoqueByEan.get(ean) ?? 0);
    const alvo = Math.max(1, Math.floor(Number(qtd || 1)));
    const final = est > 0 ? Math.min(alvo, est) : alvo;

    const it = cart.items.find((x) => x.ean === ean);
    if (!it) return;

    if (final > it.qtd) {
      for (let i = 0; i < final - it.qtd; i++) incSafe(ean);
    } else if (final < it.qtd) {
      for (let i = 0; i < it.qtd - final; i++) cart.dec(ean);
    }
  }

  const mensagem = useMemo(() => {
    if (!cart.items.length) return "Olá! Quero fazer um pedido da DF Distribuidora.";
    const linhas = cart.items.map((it) => `• ${it.nome} (${it.ean}) — ${it.qtd}x — ${brl(it.preco)}`);
    const total = brl(cart.subtotal);
    return `Olá! Quero finalizar meu pedido:\n\n${linhas.join("\n")}\n\nTotal: ${total}\n\nPode confirmar disponibilidade e prazo?`;
  }, [cart.items, cart.subtotal]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-extrabold text-lg">🛒 Seu carrinho</div>
          <button onClick={onClose} className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 font-extrabold">
            Continuar comprando
          </button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          {cart.items.length === 0 ? (
            <div className="text-gray-600 bg-gray-50 border rounded-2xl p-4">Seu carrinho está vazio. Adicione itens 😊</div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((it) => {
                const est = Number(estoqueByEan.get(it.ean) ?? 0);
                const max = Math.max(1, est || 1);
                const travado = est > 0 ? Math.min(it.qtd, est) : it.qtd;

                return (
                  <div key={it.ean} className="border rounded-2xl p-3 flex gap-3">
                    <div className="h-14 w-14 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                      <Image
                        src={it.imagem || "/produtos/caixa-padrao.png"}
                        alt={it.nome}
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="font-extrabold text-sm line-clamp-2">{it.nome}</div>
                      <div className="text-xs text-gray-500">EAN: {it.ean}</div>
                      <div className="mt-1 font-extrabold text-blue-900">{brl(it.preco)}</div>

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => cart.dec(it.ean)}
                          className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold border rounded-xl"
                        >
                          –
                        </button>

                        <input
                          type="number"
                          min={1}
                          max={max}
                          value={travado}
                          onChange={(e) => setQtdSafe(it.ean, Number(e.target.value))}
                          className="w-16 h-9 border rounded-xl text-center font-extrabold"
                        />

                        <button
                          onClick={() => incSafe(it.ean)}
                          disabled={est > 0 && it.qtd >= est}
                          className={`w-9 h-9 font-extrabold border rounded-xl ${
                            est > 0 && it.qtd >= est ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          +
                        </button>

                        <button
                          onClick={() => cart.remove(it.ean)}
                          className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-extrabold ml-auto"
                          title="Remover item"
                        >
                          Remover
                        </button>
                      </div>

                      <div className="mt-2 text-[11px] text-gray-500">
                        {est > 0 ? (
                          <>
                            Disponível: <b>{est}</b>
                          </>
                        ) : (
                          <span className="text-red-600 font-bold">Sem estoque / indisponível</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Subtotal</div>
            <div className="text-lg font-extrabold text-blue-900">{brl(cart.subtotal)}</div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => cart.clear()}
              className="px-4 py-3 rounded-2xl border bg-white hover:bg-gray-50 font-extrabold"
              disabled={!cart.items.length}
            >
              Limpar
            </button>

            <a
              className={`px-4 py-3 rounded-2xl font-extrabold text-center ${
                cart.items.length ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-200 text-gray-500 pointer-events-none"
              }`}
              href={waLink(whats, mensagem)}
              target="_blank"
              rel="noreferrer"
              title="Finalizar no WhatsApp"
            >
              Finalizar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
