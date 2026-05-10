"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import { useCart } from "./_components/cart";
import { ToastProvider, useToast } from "./_components/toast";
import FVBanners from "./_components/FVBanners";
import { CartUIProvider, useCartUI } from "./_components/cart-ui";

import ClienteBadge from "./_components/ClienteBadge";
import { useCustomer, onlyDigits as onlyDigits2 } from "./_components/useCustomer";

/* =========================
   SERVIÇOS (BANNERS LATERAIS - DESKTOP)
========================= */
type ServiceAd = {
  key: string;
  title: string;
  href: string;
  img: string;
};

function serviceLink(servico: string) {
  return `/servicos/agenda?servico=${encodeURIComponent(servico)}`;
}

function ServiceSideAds() {
  const ads: ServiceAd[] = useMemo(
    () => [
      {
        key: "pressao",
        title: "Aferição de Pressão",
        href: serviceLink("Aferição de Pressão Arterial"),
        img: "/banners/pressao-vertical.jpg",
      },
      {
        key: "glicemia",
        title: "Teste de Glicemia",
        href: serviceLink("Teste de Glicemia"),
        img: "/banners/glicemia-vertical.jpg",
      },
      {
        key: "injecao",
        title: "Aplicação de Injeção",
        href: serviceLink("Aplicação de Injeção"),
        img: "/banners/injecao-vertical.jpg",
      },
      {
        key: "revisao",
        title: "Revisão de Medicamentos",
        href: serviceLink("Revisão de Medicamentos"),
        img: "/banners/revisao-vertical.jpg",
      },
    ],
    []
  );

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ads.length), 7000);
    return () => clearInterval(t);
  }, [ads.length]);

  const left = ads[idx % ads.length];
  const right = ads[(idx + 1) % ads.length];

  return (
    <>
      <div className="hidden xl:flex fixed top-28 left-3 z-40">
        <Link href={left.href} className="group" title={left.title}>
          <div className="relative w-[120px] 2xl:w-[132px] h-[360px] 2xl:h-[400px] rounded-xl overflow-hidden shadow-lg">
            <Image
              src={left.img}
              alt={left.title}
              fill
              className="object-cover group-hover:scale-[1.03] transition"
              sizes="132px"
            />
          </div>
        </Link>
      </div>

      <div className="hidden xl:flex fixed top-28 right-3 z-40">
        <Link href={right.href} className="group" title={right.title}>
          <div className="relative w-[120px] 2xl:w-[132px] h-[360px] 2xl:h-[400px] rounded-xl overflow-hidden shadow-lg">
            <Image
              src={right.img}
              alt={right.title}
              fill
              className="object-cover group-hover:scale-[1.03] transition"
              sizes="132px"
            />
          </div>
        </Link>
      </div>
    </>
  );
}

/* =========================
   TIPOS / HELPERS
========================= */
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

  // vindo da VIEW
  estoque_total: number;
  disponivel: boolean;
};

type ClienteEndereco = {
  id: string;
  cliente_id: string;
  nome: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  complemento: string | null;
  referencia: string | null;
  principal: boolean | null;
};

const VIEW_HOME = "fv_home_com_estoque";
const PAGE_SIZE = 60;

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

// ✅ helper pra centavos (corrige 3,99 -> 399 centavos e não 39900)
function toCents(v: any) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
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

/* =========================
   PAGE WRAPPER
========================= */
export default function FarmaciaVirtualHomePage() {
  return (
    <ToastProvider>
      <CartUIProvider>
        <FarmaciaVirtualHome />
      </CartUIProvider>
    </ToastProvider>
  );
}


/* =========================
   CONVERSÃO / MARKETING
========================= */
function HeroConversao() {
  const whatsappHref =
    "https://wa.me/5511952068432?text=" +
    encodeURIComponent("Olá! Vim pela Farmácia Virtual da IA Drogarias e quero fazer um pedido.");

  return (
    <section className="max-w-6xl mx-auto px-4 mt-5">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-950 via-blue-800 to-cyan-700 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_24%)]" />
        <div className="relative grid lg:grid-cols-[1.35fr,0.95fr] gap-6 p-5 sm:p-7 lg:p-9">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[11px] sm:text-xs font-extrabold tracking-wide uppercase">
              <span>💊</span>
              Farmácia online com atendimento real
            </div>

            <h1 className="mt-4 text-2xl sm:text-4xl font-black leading-tight">
              Peça seus medicamentos com <span className="text-green-300">mais praticidade</span> e receba em até 24h.
            </h1>

            <p className="mt-3 text-sm sm:text-base text-white/90 max-w-2xl">
              Você compra pelo site, fala com a farmácia quando precisar e acompanha tudo com mais segurança.
              Ideal para pedidos programados, reposição de uso contínuo e encomendas.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5 text-xs sm:text-sm">
              <span className="rounded-full bg-white/12 px-3 py-2 font-bold">✅ Atendimento farmacêutico</span>
              <span className="rounded-full bg-white/12 px-3 py-2 font-bold">🚚 Entrega em até 24h</span>
              <span className="rounded-full bg-white/12 px-3 py-2 font-bold">💳 PIX fácil no checkout</span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="#produtos-fv"
                className="inline-flex items-center justify-center rounded-2xl bg-green-400 px-5 py-3 text-sm sm:text-base font-black text-blue-950 hover:bg-green-300 transition"
              >
                Ver produtos em destaque
              </Link>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm sm:text-base font-black hover:bg-white/15 transition"
              >
                Falar com a farmácia no WhatsApp
              </a>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
              <div className="text-sm font-black">Como funciona</div>
              <div className="mt-2 text-sm text-white/90">
                Escolha os itens, finalize o pedido e nossa equipe organiza tudo para a entrega.
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
              <div className="text-sm font-black">Prazo inicial</div>
              <div className="mt-2 text-sm text-white/90">
                Entrega em até 24h, conforme disponibilidade dos produtos e região atendida.
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
              <div className="text-sm font-black">Pedido programado</div>
              <div className="mt-2 text-sm text-white/90">
                Perfeito para reposição de medicamentos, itens de uso contínuo e compras sem correria.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustMiniBar() {
  return (
    <section className="max-w-6xl mx-auto px-4 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white border border-blue-100 shadow-sm px-4 py-3">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Entrega</div>
          <div className="mt-1 text-sm font-extrabold text-gray-900">Prazo inicial de até 24h</div>
        </div>
        <div className="rounded-2xl bg-white border border-blue-100 shadow-sm px-4 py-3">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Atendimento</div>
          <div className="mt-1 text-sm font-extrabold text-gray-900">Suporte humano e farmacêutico</div>
        </div>
        <div className="rounded-2xl bg-white border border-blue-100 shadow-sm px-4 py-3">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Compra</div>
          <div className="mt-1 text-sm font-extrabold text-gray-900">Site + carrinho + checkout</div>
        </div>
      </div>
    </section>
  );
}

function FloatingWhatsAppButton() {
  const href =
    "https://wa.me/5511952068432?text=" +
    encodeURIComponent("Olá! Vim pela Farmácia Virtual da IA Drogarias e preciso de ajuda com meu pedido.");

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-24 right-4 z-[65] inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-3 text-white font-extrabold shadow-2xl hover:bg-green-600 transition"
      aria-label="Falar com a farmácia no WhatsApp"
      title="Falar com a farmácia no WhatsApp"
    >
      <span className="text-lg leading-none">💬</span>
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}

/* ✅ sem React.FC */
function GridSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
      {Array.from({ length: 12 }).map((_, i) => (
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

/* =========================
   HOME
========================= */
function FarmaciaVirtualHome() {
  const [loadingHome, setLoadingHome] = useState(true);
  const [loadingBusca, setLoadingBusca] = useState(false);

  const [busca, setBusca] = useState("");
  const [homeProdutos, setHomeProdutos] = useState<FVProduto[]>([]);
  const [resultado, setResultado] = useState<FVProduto[]>([]);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { cartOpen, openCart, closeCart } = useCartUI();
  const cart = useCart();

  const totalCarrinho = cart.subtotal;
  const qtdCarrinho = cart.countItems;

  const isSearching = !!busca.trim();

  async function loadHome(p = 0, append = false) {
    try {
      setLoadingHome(true);

      const from = p * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from(VIEW_HOME)
        .select(
          "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens,estoque_total,disponivel"
        )
        .order("destaque_home", { ascending: false })
        .order("em_promocao", { ascending: false })
        .order("nome", { ascending: true })
        .range(from, to);

      if (error) throw error;

      const arr = (data || []) as FVProduto[];
      setHasMore(arr.length === PAGE_SIZE);

      if (append) setHomeProdutos((prev) => [...prev, ...arr]);
      else setHomeProdutos(arr);

      setPage(p);
    } catch (e) {
      console.error("Erro loadHome FV:", e);
      setHomeProdutos([]);
      setHasMore(false);
    } finally {
      setLoadingHome(false);
    }
  }

  useEffect(() => {
    loadHome(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const digits = raw.replace(/\D/g, "");
        let query = supabase
          .from(VIEW_HOME)
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens,estoque_total,disponivel"
          )
          .limit(100);

        if (digits.length >= 8 && digits.length <= 14) {
          query = query.or(`ean.eq.${digits},nome.ilike.%${raw}%`);
        } else {
          query = query.ilike("nome", `%${raw}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        const ordered = ((data || []) as FVProduto[]).sort((a, b) => {
          const pa = a.disponivel ? 1 : 0;
          const pb = b.disponivel ? 1 : 0;
          if (pb !== pa) return pb - pa;

          const ppa = a.em_promocao ? 1 : 0;
          const ppb = b.em_promocao ? 1 : 0;
          if (ppb !== ppa) return ppb - ppa;

          return (a.nome || "").localeCompare(b.nome || "");
        });

        setResultado(ordered);
      } catch (e2) {
        console.error("Erro search FV:", e2);
        setResultado([]);
      } finally {
        setLoadingBusca(false);
      }
    }

    const timer = setTimeout(search, 350);
    return () => clearTimeout(timer);
  }, [busca]);

  return (
    <main className="min-h-screen bg-[#F5F7FA] pb-24 text-slate-950">
      <ServiceSideAds />

      <header className="sticky top-0 z-40 bg-[#0D47A1] shadow-lg shadow-blue-950/10 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3">
          {/* MOBILE */}
          <div className="flex items-center justify-between gap-3 md:hidden">
            <div className="text-white font-extrabold whitespace-nowrap">
              IA Drogarias <span className="opacity-80">• FV</span>
            </div>

            <div className="flex items-center gap-2">
              <ClienteBadge />
              <button
                type="button"
                onClick={openCart}
                className="relative text-white font-extrabold whitespace-nowrap bg-white/15 hover:bg-white/25 px-4 py-2.5 rounded-full shadow-sm"
                title="Abrir carrinho"
              >
                🛒 {brl(totalCarrinho)}
                {qtdCarrinho > 0 && (
                  <span className="absolute -top-2 -right-2 h-6 min-w-[24px] px-1 rounded-full bg-green-400 text-blue-900 text-xs font-extrabold flex items-center justify-center border-2 border-blue-700">
                    {qtdCarrinho}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="mt-3 md:hidden">
            <div className="relative">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite o nome do medicamento ou EAN..."
                className="w-full rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-white/25 shadow-inner"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {busca.trim() ? (
                  <button
                    type="button"
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
              IA Drogarias <span className="opacity-80">• FV</span>
            </div>

            <div className="flex-1">
              <div className="relative">
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Digite o nome do medicamento ou EAN..."
                  enterKeyHint="search"
                  aria-label="Buscar produto"
                  className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-white/25 shadow-inner"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {busca.trim() ? (
                    <button
                      type="button"
                      onClick={() => setBusca("")}
                      className="text-xs font-extrabold px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                      title="Limpar"
                      aria-label="Limpar busca"
                    >
                      Limpar
                    </button>
                  ) : null}

                  <span className="text-blue-900 bg-green-400/90 px-2 py-1 rounded-full text-xs font-extrabold" aria-hidden>
                    🔎
                  </span>
                </div>
              </div>

              {isSearching ? (
                <div className="mt-1 text-[11px] text-white/80 min-h-[16px]">
                  {loadingBusca ? "Buscando…" : resultado.length ? `${resultado.length} resultado(s)` : "Nenhum resultado"}
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-white/80 min-h-[16px]"> </div>
              )}
            </div>

            <ClienteBadge />

            <button
              type="button"
              onClick={openCart}
              className="relative text-white font-extrabold whitespace-nowrap bg-white/15 hover:bg-white/25 px-4 py-2.5 rounded-full shadow-sm"
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
          </div>
        </div>
      </header>

      <section className="mt-4 max-w-6xl mx-auto px-4">
        <div className="overflow-hidden rounded-[28px] shadow-sm xl:max-h-[230px] 2xl:max-h-[260px] bg-white border border-slate-100">
          <FVBanners />
        </div>
      </section>

      <HeroConversao />
      <TrustMiniBar />

      <section id="produtos-fv" className="max-w-6xl mx-auto px-4 mt-6">
        <ServiceQuickAds />

        {isSearching ? (
          <>
            <div className="flex items-end justify-between gap-3 mb-3">
              <h2 className="text-lg font-extrabold text-gray-900">
                Resultados <span className="text-gray-500">({resultado.length})</span>
              </h2>
            </div>

            {loadingBusca ? (
              <GridSkeleton />
            ) : resultado.length === 0 ? (
              <div className="bg-white border rounded-2xl p-6 text-gray-600">Nenhum produto encontrado. Tente outro nome, apresentação ou EAN.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
                {resultado.map((p) => (
                  <ProdutoCardUltra key={p.id} p={p} onComprar={openCart} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Medicamentos e produtos em destaque</h2>
                <p className="text-xs text-gray-500 mt-1">Seleção inicial da Farmácia Virtual para pedidos online.</p>
              </div>
              <div className="text-xs text-gray-500">{homeProdutos.length}+ itens</div>
            </div>

            {loadingHome ? (
              <GridSkeleton />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
                  {homeProdutos.map((p) => (
                    <ProdutoCardUltra key={p.id} p={p} onComprar={openCart} />
                  ))}
                </div>

                {hasMore ? (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => loadHome(page + 1, true)}
                      className="px-6 py-3 rounded-2xl bg-white border hover:bg-gray-50 font-extrabold"
                      disabled={loadingHome}
                    >
                      {loadingHome ? "Carregando..." : "Carregar mais"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </section>

      <FloatingWhatsAppButton />
      <CartModalPDV open={cartOpen} onClose={closeCart} />
    </main>
  );
}

function CartModalPDV({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const cart = useCart();
  const [saving, setSaving] = useState(false);

  const subtotal = useMemo(() => {
    return cart.items.reduce((acc, it) => acc + Number(it.preco || 0) * Number(it.qtd || 0), 0);
  }, [cart.items]);

  function clearCartSafe() {
    if (typeof (cart as any).clear === "function") (cart as any).clear();
    else cart.items.forEach((it) => cart.remove(it.ean));
  }

  function finalizarPedido() {
    if (!cart.items.length || saving) return;

    setSaving(true);

    try {
      onClose();
      router.push("/fv/carrinho");
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full sm:w-[460px] bg-white shadow-2xl flex flex-col">
        {/* HEADER */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-extrabold text-lg">🛒 Carrinho</div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl border font-extrabold bg-white hover:bg-gray-50"
          >
            Continuar comprando
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 flex-1 overflow-auto">
          {cart.items.length === 0 ? (
            <div className="text-gray-600 bg-gray-50 border rounded-2xl p-4">
              Seu carrinho está vazio. Adicione itens 😊
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((it) => (
                <div key={it.ean} className="border rounded-2xl p-3 flex gap-3">
                  <div className="h-16 w-16 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                    <Image
                      src={it.imagem || "/produtos/caixa-padrao.png"}
                      alt={it.nome}
                      width={72}
                      height={72}
                      className="object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-sm line-clamp-2">
                      {it.nome}
                    </div>

                    <div className="text-xs text-gray-500">
                      EAN: {it.ean}
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="font-extrabold text-blue-900">
                        {brl(it.preco)}
                      </div>

                      <div className="text-xs font-bold text-gray-600">
                        Item: {brl(Number(it.preco || 0) * Number(it.qtd || 0))}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => cart.dec(it.ean)}
                        className="w-10 h-10 rounded-xl border bg-white hover:bg-gray-50 font-extrabold"
                        disabled={saving}
                      >
                        –
                      </button>

                      <div className="w-10 h-10 rounded-xl border bg-gray-50 flex items-center justify-center font-extrabold">
                        {it.qtd}
                      </div>

                      <button
                        type="button"
                        onClick={() => cart.inc(it.ean)}
                        className="w-10 h-10 rounded-xl border bg-white hover:bg-gray-50 font-extrabold"
                        disabled={saving}
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() => cart.remove(it.ean)}
                        className="ml-auto px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-extrabold text-red-600"
                        disabled={saving}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Subtotal</div>
            <div className="text-xl font-extrabold text-blue-900">
              {brl(subtotal)}
            </div>
          </div>

          <div className="mt-1 text-xs text-gray-500">
            Entrega, dados e pagamento serão definidos na próxima etapa.
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={clearCartSafe}
              className="px-4 py-3 rounded-2xl border bg-white hover:bg-gray-50 font-extrabold"
              disabled={!cart.items.length || saving}
            >
              Limpar
            </button>

            <button
              type="button"
              disabled={!cart.items.length || saving}
              onClick={finalizarPedido}
              className={`px-4 py-3 rounded-2xl font-extrabold text-center ${
                cart.items.length
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-200 text-gray-500"
              } ${saving ? "opacity-70 cursor-wait" : ""}`}
            >
              {saving ? "Abrindo..." : "Finalizar pedido"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProdutoCardUltra({ p, onComprar }: { p: FVProduto; onComprar: () => void }) {
  const pr = precoFinal(p);
  const cart = useCart();
  const { push } = useToast();
  const [qtd, setQtd] = useState(1);

  const disponivel = !!p.disponivel;
  const estoque = Number(p.estoque_total || 0);

  const hrefProduto = `/fv/produtos/${p.ean}`;

  function addEAbreCarrinho() {
    const ean = String(p.ean || "").trim();
    if (!ean) return;

    cart.addItem(
      {
        ean,
        nome: p.nome,
        laboratorio: p.laboratorio,
        apresentacao: p.apresentacao,
        imagem: firstImg(p.imagens),
        preco: Number(pr.final || 0),
      },
      qtd
    );

    push({
      title: disponivel ? "Adicionado ao carrinho ✅" : "Encomenda adicionada ✅",
      desc: `${p.nome} • ${qtd}x`,
    });

    setQtd(1);
    onComprar();
  }

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/10 transition overflow-hidden flex flex-col">
      <div className="relative p-3">
        <Link href={hrefProduto} className="bg-gradient-to-br from-slate-50 to-white rounded-[20px] p-3 flex items-center justify-center hover:opacity-95 transition border border-slate-100">
          <Image src={firstImg(p.imagens)} alt={p.nome || "Produto"} width={240} height={240} className="rounded object-contain h-24 sm:h-28" />
        </Link>

        {pr.emPromo && pr.off > 0 ? (
          <span className="absolute top-3 right-3 text-[11px] font-extrabold bg-red-600 text-white px-2 py-1 rounded-full shadow-sm">
            {pr.off}% OFF
          </span>
        ) : null}

        <span
          className={`absolute top-3 left-3 text-[11px] font-extrabold px-2 py-1 rounded-full shadow-sm ${
            disponivel ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
          title={disponivel ? "Disponível" : "Produto sob encomenda"}
        >
          {disponivel ? `Estoque: ${estoque}` : "Sob encomenda"}
        </span>
      </div>

      <div className="px-3 pb-3 flex-1 flex flex-col">
        <div className="text-[11px] text-gray-500 line-clamp-1">{p.laboratorio || "—"}</div>

        <Link href={hrefProduto} className="mt-1 font-black text-slate-950 text-xs sm:text-sm line-clamp-2 hover:text-[#0D47A1] transition">
          {p.nome}
        </Link>

        {p.apresentacao ? <div className="text-[11px] text-gray-600 mt-1 line-clamp-1">{p.apresentacao}</div> : null}

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

          <div className="mt-1 text-[11px] font-bold text-gray-500">
            {disponivel ? "Pedido online com retirada ou entrega conforme regra da loja." : "Produto sob encomenda com prazo inicial de até 24h."}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setQtd((x) => Math.max(1, x - 1))}
              className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold"
              aria-label="Diminuir quantidade"
            >
              –
            </button>
            <div className="w-10 text-center font-extrabold text-sm">{qtd}</div>
            <button
              type="button"
              onClick={() => setQtd((x) => x + 1)}
              className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold"
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={addEAbreCarrinho}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold ${
              disponivel ? "bg-blue-700 hover:bg-blue-800 text-white" : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {disponivel ? "Comprar" : "Encomendar 24h"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ✅ faixa serviços */
function ServiceQuickAds() {
  const base = "/servicos/agenda";
  const link = (servico: string) => `${base}?servico=${encodeURIComponent(servico)}`;

  const cards = [
    { key: "pressao", title: "Aferição de Pressão", subtitle: "Rápido e prático", href: link("Aferição de Pressão Arterial"), emoji: "🩺", gradient: "from-blue-600 to-blue-400" },
    { key: "glicemia", title: "Teste de Glicemia", subtitle: "Resultado na hora", href: link("Teste de Glicemia"), emoji: "🩸", gradient: "from-orange-500 to-amber-400" },
    { key: "injecao", title: "Aplicação de Injeção", subtitle: "Com profissional", href: link("Aplicação de Injeção"), emoji: "💉", gradient: "from-emerald-600 to-green-400" },
    { key: "revisao", title: "Revisão de Medicamentos", subtitle: "Mais segurança", href: link("Revisão de Medicamentos"), emoji: "📋", gradient: "from-indigo-600 to-sky-400" },
  ];

  return (
    <div className="xl:hidden mt-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-extrabold text-sm text-gray-900">Serviços farmacêuticos</div>
          <div className="text-[11px] text-gray-500">Agende diretamente pela plataforma</div>
        </div>
        <div className="text-[11px] text-gray-500">Arraste →</div>
      </div>

      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex gap-3 min-w-max snap-x snap-mandatory">
          {cards.map((c) => (
            <Link
              key={c.key}
              href={c.href}
              className={`snap-start w-[240px] rounded-2xl p-4 text-white shadow-sm border border-white/10 bg-gradient-to-br ${c.gradient} active:scale-[0.99] transition`}
            >
              <div className="flex items-start justify-between">
                <div className="text-3xl">{c.emoji}</div>
                <span className="text-[11px] font-extrabold bg-white/15 px-2 py-1 rounded-full">Agendar</span>
              </div>

              <div className="mt-3">
                <div className="text-base font-extrabold leading-tight">{c.title}</div>
                <div className="text-xs text-white/90 mt-1">{c.subtitle}</div>
              </div>

              <div className="mt-4">
                <div className="inline-flex items-center gap-2 bg-white text-blue-900 font-extrabold text-xs px-3 py-2 rounded-xl">
                  Abrir agenda →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
