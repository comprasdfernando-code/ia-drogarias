// app/dfdistribuidora/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { CartProvider, useCart } from "./_components/cart";
import { ToastProvider, useToast } from "./_components/toast";
import FVBanners from "./_components/FVBanners";

/* =========================
   SENHA SIMPLES (LOCAL)
   - fica salva no navegador (localStorage)
   - 🔴 troque DF_SENHA
========================= */
const DF_SENHA = "102030"; // 🔴 troque
const LS_KEY = "df_public_ok";

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
  destaque_home: boolean | null;
  ativo: boolean | null;
  imagens: string[] | null;
  estoque: number | null;
};

const PROD_TABLE = "df_produtos";
const RPC_SEARCH = "df_search_produtos";
const PREFIX = "/dfdistribuidora";

const WHATS_DF = "5511952068432";

const BRAND_TOP = "IA Drogarias";
const BRAND_SUB = "• DF Distribuidora";

const HOME_LIMIT = 100;
const SEARCH_LIMIT = 180;
const SEARCH_DEBOUNCE = 350;

/* =========================
   HELPERS
========================= */
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

function waLink(phone: string, msg: string) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function normalizeSearch(raw: string) {
  return raw
    .toLowerCase()
    .replace(/(\d+)\s*(mg|ml|mcg|g|ui|iu)/gi, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================
   PAGE WRAPPER
========================= */
export default function DFDistribuidoraHomePage() {
  const [ok, setOk] = useState(false);
  const [senha, setSenha] = useState("");

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem(LS_KEY) === "1";
    if (saved) setOk(true);
  }, []);

  function entrar() {
    if (senha === DF_SENHA) {
      localStorage.setItem(LS_KEY, "1");
      setOk(true);
    } else {
      alert("Senha incorreta.");
    }
  }

  function sair() {
    localStorage.removeItem(LS_KEY);
    setOk(false);
    setSenha("");
  }

  if (!ok) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border rounded-3xl shadow-sm p-6">
          <div className="text-xl font-extrabold text-gray-900">Acesso • DF Distribuidora</div>
          <div className="text-sm text-gray-600 mt-1">Digite a senha para entrar.</div>

          <input
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? entrar() : null)}
            type="password"
            placeholder="Senha"
            className="mt-4 w-full border rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100"
          />

          <button onClick={entrar} className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white rounded-2xl py-3 font-extrabold">
            Entrar
          </button>

          <div className="mt-3 text-[11px] text-gray-500">Fica salvo neste navegador (localStorage).</div>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <ToastProvider>
        <DFDistribuidoraHome onSair={sair} />
      </ToastProvider>
    </CartProvider>
  );
}

/* =========================
   PAGE
========================= */
function DFDistribuidoraHome({ onSair }: { onSair: () => void }) {
  const [loadingHome, setLoadingHome] = useState(true);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [busca, setBusca] = useState("");

  const [homeProdutos, setHomeProdutos] = useState<DFProduto[]>([]);
  const [resultado, setResultado] = useState<DFProduto[]>([]);

  const [cartOpen, setCartOpen] = useState(false);

  const cart = useCart();
  const totalCarrinho = cart.subtotal;
  const qtdCarrinho = cart.countItems;

  const isSearching = !!busca.trim();

  const estoqueByEan = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of homeProdutos) m.set(p.ean, Number(p.estoque ?? 0));
    for (const p of resultado) m.set(p.ean, Number(p.estoque ?? 0));
    return m;
  }, [homeProdutos, resultado]);

  useEffect(() => {
    async function loadHome() {
      try {
        setLoadingHome(true);

        const { data, error } = await supabase
          .from(PROD_TABLE)
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens,estoque"
          )
          .eq("ativo", true)
          .gt("estoque", 0)
          .order("destaque_home", { ascending: false })
          .order("em_promocao", { ascending: false })
          .order("estoque", { ascending: false })
          .order("nome", { ascending: true })
          .limit(HOME_LIMIT);

        if (error) throw error;

        setHomeProdutos(((data || []) as DFProduto[]) ?? []);
      } catch (e) {
        console.error("Erro loadHome DF:", e);
        setHomeProdutos([]);
      } finally {
        setLoadingHome(false);
      }
    }

    loadHome();
  }, []);

  useEffect(() => {
    async function search() {
      const raw = busca.trim();
      if (!raw) {
        setResultado([]);
        return;
      }

      setLoadingBusca(true);

      try {
        const normalized = normalizeSearch(raw);
        const { data, error } = await supabase.rpc(RPC_SEARCH, { q: normalized, lim: SEARCH_LIMIT });
        if (error) throw error;

        setResultado(((data || []) as DFProduto[]) ?? []);
      } catch (e) {
        try {
          const digits = onlyDigits(raw);

          let query = supabase
            .from(PROD_TABLE)
            .select(
              "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens,estoque"
            )
            .eq("ativo", true)
            .limit(SEARCH_LIMIT);

          if (digits.length >= 8 && digits.length <= 14) query = query.or(`ean.eq.${digits},nome.ilike.%${raw}%`);
          else query = query.ilike("nome", `%${raw}%`);

          const { data, error } = await query.order("em_promocao", { ascending: false }).order("nome", { ascending: true });

          if (error) throw error;

          setResultado(((data || []) as DFProduto[]) ?? []);
        } catch (e2) {
          console.error("Erro fallback search DF:", e2);
          setResultado([]);
        }
      } finally {
        setLoadingBusca(false);
      }
    }

    const timer = setTimeout(search, SEARCH_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [busca]);

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-40 bg-blue-700 shadow">
        <div className="mx-auto max-w-6xl px-4 py-3">
          {/* MOBILE */}
          <div className="flex items-center justify-between gap-3 md:hidden">
            <div className="text-white font-extrabold whitespace-nowrap">
              {BRAND_TOP} <span className="opacity-80">{BRAND_SUB}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCartOpen(true)}
                className="relative text-white font-extrabold whitespace-nowrap bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full"
                title="Abrir carrinho"
              >
                🛒 {brl(totalCarrinho)}
                {qtdCarrinho > 0 && (
                  <span className="absolute -top-2 -right-2 h-6 min-w-[24px] px-1 rounded-full bg-green-400 text-blue-900 text-xs font-extrabold flex items-center justify-center border-2 border-blue-700">
                    {qtdCarrinho}
                  </span>
                )}
              </button>

              <button
                onClick={onSair}
                className="text-white font-extrabold bg-white/10 hover:bg-white/15 px-3 py-2 rounded-full"
                title="Sair"
              >
                Sair
              </button>
            </div>
          </div>

          <div className="mt-3 md:hidden">
            <div className="relative">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite o nome do produto ou EAN..."
                className="w-full rounded-full bg-white/95 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-white/20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {busca.trim() ? (
                  <button
                    onClick={() => setBusca("")}
                    className="text-xs font-extrabold px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                    title="Limpar"
                  >
                    Limpar
                  </button>
                ) : null}
                <span className="text-blue-900 bg-green-400/90 px-2 py-1 rounded-full text-xs font-extrabold">🔎</span>
              </div>
            </div>

            {isSearching && (
              <div className="mt-1 text-[11px] text-white/80">
                {loadingBusca ? "Buscando…" : resultado.length ? `${resultado.length} resultado(s)` : " "}
              </div>
            )}
          </div>

          {/* DESKTOP */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-white font-extrabold whitespace-nowrap">
              {BRAND_TOP} <span className="opacity-80">{BRAND_SUB}</span>
            </div>

            <div className="flex-1">
              <div className="relative">
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Digite o nome do produto ou EAN..."
                  className="w-full rounded-full bg-white/95 px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-white/20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {busca.trim() ? (
                    <button
                      onClick={() => setBusca("")}
                      className="text-xs font-extrabold px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                      title="Limpar"
                    >
                      Limpar
                    </button>
                  ) : null}
                  <span className="text-blue-900 bg-green-400/90 px-2 py-1 rounded-full text-xs font-extrabold">🔎</span>
                </div>
              </div>

              {isSearching && (
                <div className="mt-1 text-[11px] text-white/80">
                  {loadingBusca ? "Buscando…" : resultado.length ? `${resultado.length} resultado(s)` : " "}
                </div>
              )}
            </div>

            <button
              onClick={() => setCartOpen(true)}
              className="relative text-white font-extrabold whitespace-nowrap bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full"
              title="Abrir carrinho"
            >
              🛒 <span className="hidden lg:inline">Carrinho • </span>
              {brl(totalCarrinho)}
              {qtdCarrinho > 0 && (
                <span className="absolute -top-2 -right-2 h-6 min-w-[24px] px-1 rounded-full bg-green-400 text-blue-900 text-xs font-extrabold flex items-center justify-center border-2 border-blue-700">
                  {qtdCarrinho}
                </span>
              )}
            </button>

            <button onClick={onSair} className="text-white font-extrabold bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full" title="Sair">
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mt-4">
        <FVBanners />
      </div>

      <section className="max-w-6xl mx-auto px-4">
        {isSearching ? (
          <div className="mt-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">
              Resultados <span className="text-gray-500">({resultado.length})</span>
            </h2>

            {loadingBusca ? (
              <GridSkeleton />
            ) : resultado.length === 0 ? (
              <div className="bg-white border rounded-2xl p-6 text-gray-600">Nenhum produto encontrado.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
                {resultado.map((p) => (
                  <ProdutoCardUltra key={p.id} p={p} prefix={PREFIX} onEncomendar={() => encomendarDF(p)} estoqueByEan={estoqueByEan} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8">
            <h2 className="text-lg font-extrabold text-gray-900 mb-3">
              Produtos disponíveis <span className="text-gray-500">({homeProdutos.length})</span>
            </h2>

            {loadingHome ? (
              <GridSkeleton />
            ) : homeProdutos.length === 0 ? (
              <div className="bg-white border rounded-2xl p-6 text-gray-600">Nenhum produto com estoque disponível no momento.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
                {homeProdutos.map((p) => (
                  <ProdutoCardUltra key={p.id} p={p} prefix={PREFIX} onEncomendar={() => encomendarDF(p)} estoqueByEan={estoqueByEan} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-12 pb-12">
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <h3 className="text-xl md:text-2xl font-extrabold text-gray-900">Compra rápida</h3>
          <p className="text-gray-600 mt-1">Adicione no carrinho e finalize no WhatsApp em poucos cliques.</p>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="flex gap-3 items-start">
              <div className="h-11 w-11 rounded-2xl bg-gray-100 flex items-center justify-center text-lg">⚡</div>
              <div>
                <div className="font-extrabold">Rápido</div>
                <div className="text-sm text-gray-600">Carrinho modal para melhor agilidade</div>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="h-11 w-11 rounded-2xl bg-gray-100 flex items-center justify-center text-lg">✅</div>
              <div>
                <div className="font-extrabold">Confirmação</div>
                <div className="text-sm text-gray-600">Checamos disponibilidade e retornamos</div>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="h-11 w-11 rounded-2xl bg-gray-100 flex items-center justify-center text-lg">🚚</div>
              <div>
                <div className="font-extrabold">Entrega</div>
                <div className="text-sm text-gray-600">Prazo e taxa conforme região</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border p-4 bg-gray-50">
            <div className="text-xs uppercase tracking-wide text-gray-500 font-bold">Dica</div>
            <div className="font-extrabold text-gray-900">Pesquise pelo nome ou EAN pra achar rapidinho.</div>
          </div>
        </div>
      </section>

      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} whats={WHATS_DF} estoqueByEan={estoqueByEan} />
    </main>
  );

  function encomendarDF(p: DFProduto) {
    const msg =
      `Olá! Quero encomendar este item:\n\n` +
      `• ${p.nome} (EAN: ${p.ean})\n` +
      (p.apresentacao ? `• Apresentação: ${p.apresentacao}\n` : "") +
      (p.laboratorio ? `• Laboratório: ${p.laboratorio}\n` : "") +
      `\nPode me avisar prazo e valor?`;
    window.open(waLink(WHATS_DF, msg), "_blank");
  }
}

/* =========================
   CART MODAL (com trava de estoque)
========================= */
/* =========================
   CART MODAL (ESTILO PDV + trava de estoque)
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

  function clearCart() {
    if (!cart.items.length) return;
    if (!confirm("Limpar carrinho?")) return;
    cart.clear();
  }

  const mensagem = useMemo(() => {
    if (!cart.items.length) return "Olá! Quero fazer um pedido da DF Distribuidora.";
    const linhas = cart.items.map((it) => `• ${it.nome} (${it.ean}) — ${it.qtd}x — ${brl(it.preco * it.qtd)}`);
    const total = brl(cart.subtotal);
    return `Olá! Quero finalizar meu pedido:\n\n${linhas.join("\n")}\n\nTotal: ${total}\n\nPode confirmar disponibilidade e prazo?`;
  }, [cart.items, cart.subtotal]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-gray-50 shadow-2xl flex flex-col">
        {/* HEADER */}
        <div className="p-4 bg-white border-b flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-gray-500">Carrinho</div>
            <div className="text-lg font-extrabold text-gray-900">
              Itens: {cart.items.reduce((a, b) => a + (b.qtd || 0), 0)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearCart}
              disabled={!cart.items.length}
              className={`px-3 py-2 rounded-2xl font-extrabold text-sm border ${
                !cart.items.length ? "bg-gray-100 text-gray-400" : "bg-white hover:bg-gray-50"
              }`}
              title="Limpar carrinho"
            >
              Limpar
            </button>

            <button
              onClick={onClose}
              className="px-3 py-2 rounded-2xl border bg-white hover:bg-gray-50 font-extrabold text-sm"
              title="Continuar comprando"
            >
              Voltar
            </button>
          </div>
        </div>

        {/* ITENS */}
        <div className="p-4 flex-1 overflow-auto">
          {cart.items.length === 0 ? (
            <div className="bg-white border rounded-3xl p-6 text-gray-600">
              Seu carrinho está vazio.
              <div className="text-xs text-gray-500 mt-1">Adicione produtos para finalizar no WhatsApp.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((it) => {
                const est = Number(estoqueByEan.get(it.ean) ?? 0);
                const max = Math.max(1, est || 1);
                const travado = est > 0 ? Math.min(it.qtd, est) : it.qtd;

                const badge =
                  est <= 0 ? (
                    <span className="text-[11px] font-extrabold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                      Estoque 0
                    </span>
                  ) : est <= 5 ? (
                    <span className="text-[11px] font-extrabold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Baixo: {est}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-gray-500">Disp: {est}</span>
                  );

                return (
                  <div key={it.ean} className="bg-white border rounded-3xl p-3">
                    <div className="flex gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-gray-50 border overflow-hidden flex items-center justify-center shrink-0">
                        <Image
                          src={it.imagem || "/produtos/caixa-padrao.png"}
                          alt={it.nome}
                          width={56}
                          height={56}
                          className="object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-extrabold text-gray-900 line-clamp-2">{it.nome}</div>
                            <div className="text-[11px] text-gray-500">
                              EAN: <b>{it.ean}</b>
                            </div>
                          </div>

                          <button
                            onClick={() => cart.remove(it.ean)}
                            className="text-red-600 font-extrabold text-sm hover:underline"
                            title="Remover item"
                          >
                            Remover
                          </button>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="text-sm font-extrabold text-blue-900">{brl(it.preco)}</div>
                          {badge}
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => cart.dec(it.ean)}
                            className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 font-extrabold"
                            title="Diminuir"
                          >
                            −
                          </button>

                          <input
                            type="number"
                            min={1}
                            max={max}
                            value={travado}
                            onChange={(e) => setQtdSafe(it.ean, Number(e.target.value))}
                            className="w-20 h-10 rounded-2xl border text-center font-extrabold outline-none focus:ring-4 focus:ring-blue-100"
                            title="Quantidade"
                          />

                          <button
                            onClick={() => incSafe(it.ean)}
                            disabled={est > 0 && it.qtd >= est}
                            className={`w-10 h-10 rounded-2xl font-extrabold ${
                              est > 0 && it.qtd >= est
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-blue-700 hover:bg-blue-800 text-white"
                            }`}
                            title="Aumentar"
                          >
                            +
                          </button>

                          <div className="ml-auto font-extrabold text-gray-900">{brl(it.preco * it.qtd)}</div>
                        </div>

                        {est > 0 && it.qtd >= est ? (
                          <div className="mt-2 text-xs font-bold text-yellow-700">Limite do estoque atingido.</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TOTAIS + FINALIZAR */}
        <div className="p-4 bg-white border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 font-bold">Subtotal</div>
            <div className="text-xl font-extrabold text-blue-900">{brl(cart.subtotal)}</div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={clearCart}
              className="px-4 py-3 rounded-2xl border bg-white hover:bg-gray-50 font-extrabold"
              disabled={!cart.items.length}
            >
              Limpar
            </button>

            <a
              className={`px-4 py-3 rounded-2xl font-extrabold text-center ${
                cart.items.length ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-200 text-gray-500 pointer-events-none"
              }`}
              href={waLink(whats, mensagem)}
              target="_blank"
              rel="noreferrer"
              title="Finalizar no WhatsApp"
            >
              Finalizar no WhatsApp
            </a>
          </div>

          {!cart.items.length ? (
            <div className="mt-2 text-xs text-gray-500">Adicione itens para liberar o botão de finalizar.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


/* =========================
   PRODUTO CARD (com estoque/indisponível/encomendar)
========================= */
function ProdutoCardUltra({
  p,
  prefix,
  onEncomendar,
  estoqueByEan,
}: {
  p: DFProduto;
  prefix: string;
  onEncomendar: () => void;
  estoqueByEan: Map<string, number>;
}) {
  const pr = precoFinal(p);
  const cart = useCart();
  const { push } = useToast();
  const [qtd, setQtd] = useState(1);

  const estoqueAtual = Number(estoqueByEan.get(p.ean) ?? p.estoque ?? 0);
  const indisponivel = estoqueAtual <= 0;

  function add() {
    if (indisponivel) return;

    const already = cart.items.find((x) => x.ean === p.ean)?.qtd ?? 0;
    const want = Math.max(1, qtd);

    if (estoqueAtual > 0 && already + want > estoqueAtual) {
      const canAdd = Math.max(0, estoqueAtual - already);
      if (canAdd <= 0) {
        push({ title: "Sem estoque 😕", desc: "Você já atingiu o limite disponível." });
        return;
      }
      cart.addItem(
        {
          ean: p.ean,
          nome: p.nome,
          laboratorio: p.laboratorio,
          apresentacao: p.apresentacao,
          imagem: firstImg(p.imagens),
          preco: pr.final || 0,
        },
        canAdd
      );
      push({ title: "Adicionado ao carrinho ✅", desc: `${p.nome} • ${canAdd}x (limite do estoque)` });
      setQtd(1);
      return;
    }

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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      <div className="relative p-3">
        <Link href={`${prefix}/produtos/${p.ean}`} className="bg-gray-50 rounded-xl p-2 flex items-center justify-center hover:opacity-95 transition">
          <Image src={firstImg(p.imagens)} alt={p.nome || "Produto"} width={240} height={240} className="rounded object-contain h-24 sm:h-28" />
        </Link>

        {pr.emPromo && pr.off > 0 && (
          <span className="absolute top-3 right-3 text-[11px] font-extrabold bg-red-600 text-white px-2 py-1 rounded-full shadow-sm">
            {pr.off}% OFF
          </span>
        )}
      </div>

      <div className="px-3 pb-3 flex-1 flex flex-col">
        <div className="text-[11px] text-gray-500 line-clamp-1">{p.laboratorio || "—"}</div>

        <Link href={`${prefix}/produtos/${p.ean}`} className="mt-1 font-semibold text-blue-950 text-xs sm:text-sm line-clamp-2 hover:underline">
          {p.nome}
        </Link>

        {p.apresentacao && <div className="text-[11px] text-gray-600 mt-1 line-clamp-1">{p.apresentacao}</div>}

        <div className="mt-2">
          {pr.emPromo ? (
            <>
              <div className="text-xs text-gray-500">
                De <span className="line-through">{brl(pr.pmc)}</span>
              </div>
              <div className="text-base font-extrabold text-blue-900">Por {brl(pr.final)}</div>
            </>
          ) : (
            <div className="text-base font-extrabold text-blue-900">{brl(pr.final)}</div>
          )}
        </div>

        <div className="mt-2 text-[11px]">
          {indisponivel ? <span className="font-extrabold text-gray-500">Sem estoque</span> : <span className="font-bold text-gray-500">Estoque: {estoqueAtual}</span>}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center border rounded-xl overflow-hidden">
            <button onClick={() => setQtd((x) => Math.max(1, x - 1))} className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold" disabled={indisponivel}>
              –
            </button>
            <div className="w-10 text-center font-extrabold text-sm">{qtd}</div>
            <button onClick={() => setQtd((x) => x + 1)} className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold" disabled={indisponivel}>
              +
            </button>
          </div>

          <button
            onClick={add}
            disabled={indisponivel}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold ${
              indisponivel ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800 text-white"
            }`}
          >
            {indisponivel ? "Indisponível" : "Comprar"}
          </button>
        </div>

        {indisponivel ? (
          <button onClick={onEncomendar} className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-xs sm:text-sm font-extrabold">
            Encomendar
          </button>
        ) : null}
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-3">
            <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          </div>
          <div className="px-3 pb-3">
            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
            <div className="mt-2 h-4 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="mt-2 h-4 w-28 bg-gray-100 rounded animate-pulse" />
            <div className="mt-3 h-10 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
