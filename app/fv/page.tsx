
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

import { useCart } from "./_components/cart";
import { ToastProvider, useToast } from "./_components/toast";
import FVBanners from "./_components/FVBanners";
import { CartUIProvider, useCartUI } from "./_components/cart-ui";

/* =========================
   SERVIÇOS (BANNERS LATERAIS - DESKTOP)
   - Desktop: usa as artes verticais e abre a agenda
   - Mobile: NÃO aparece aqui (pra não ficar no topo)
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
      {/* LATERAIS (somente desktop grande) */}
      <div className="hidden xl:flex fixed top-28 left-3 z-40">
        <Link href={left.href} className="group" title={left.title}>
          <div className="relative w-[160px] h-[520px] rounded-xl overflow-hidden shadow-lg">
            <Image
              src={left.img}
              alt={left.title}
              fill
              className="object-cover group-hover:scale-[1.03] transition"
              sizes="160px"
            />
          </div>
        </Link>
      </div>

      <div className="hidden xl:flex fixed top-28 right-3 z-40">
        <Link href={right.href} className="group" title={right.title}>
          <div className="relative w-[160px] h-[520px] rounded-xl overflow-hidden shadow-lg">
            <Image
              src={right.img}
              alt={right.title}
              fill
              className="object-cover group-hover:scale-[1.03] transition"
              sizes="160px"
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

const VIEW_HOME = "fv_home_com_estoque";
const PAGE_SIZE = 60;

function brl(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
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

/* ✅ CORRIGIDO: sem React.FC (evita erro do GridSkeleton no App Router) */
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

  // LOAD HOME
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

  // SEARCH
  useEffect(() => {
    async function search() {
      const raw = busca.trim();
      if (!raw) {
        setResultado([]);
        return;
      }

      setLoadingBusca(true);
      try {
        // fallback direto na VIEW
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
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* ✅ Desktop: banners laterais */}
      <ServiceSideAds />

      <header className="sticky top-0 z-40 bg-blue-700 shadow">
        <div className="mx-auto max-w-6xl px-4 py-3">
          {/* MOBILE */}
          <div className="flex items-center justify-between gap-3 md:hidden">
            <div className="text-white font-extrabold whitespace-nowrap">
              IA Drogarias <span className="opacity-80">• FV</span>
            </div>

            <button
              type="button"
              onClick={openCart}
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
          </div>

          <div className="mt-3 md:hidden">
            <div className="relative">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite o nome do medicamento ou EAN..."
                className="w-full rounded-full bg-white/95 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-white/20"
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
                  className="w-full rounded-full bg-white/95 px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-white/20"
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

                  <span
                    className="text-blue-900 bg-green-400/90 px-2 py-1 rounded-full text-xs font-extrabold"
                    aria-hidden
                  >
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

            <button
              type="button"
              onClick={openCart}
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
          </div>
        </div>
      </header>

      <div className="mt-4">
        <FVBanners />
      </div>

      <section className="max-w-6xl mx-auto px-4 mt-6">
        {/* ✅ MOBILE/TABLET: carrossel de serviços (AQUI, e não no topo) */}
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
              <div className="bg-white border rounded-2xl p-6 text-gray-600">Nenhum produto encontrado.</div>
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
              <h2 className="text-lg font-extrabold text-gray-900">Produtos em destaque</h2>
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

      {/* carrinho */}
      <CartModalPDV open={cartOpen} onClose={closeCart} />
    </main>
  );
}
function CartModalPDV({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useCart();

  const TAXA_ENTREGA_FIXA = 10;
  const PEDIDOS_TABLE = "fv_pedidos";

  const [saving, setSaving] = useState(false);
  const [pedidoCriado, setPedidoCriado] = useState<{ pronto?: string; encomenda?: string; grupo?: string } | null>(null);

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");

  const [tipoEntrega, setTipoEntrega] = useState<"ENTREGA" | "RETIRADA">("ENTREGA");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");

  const [pagamento, setPagamento] = useState<"PIX" | "CARTAO" | "DINHEIRO" | "COMBINAR">("PIX");

  const taxaEntrega = tipoEntrega === "ENTREGA" ? TAXA_ENTREGA_FIXA : 0;

  const subtotal = useMemo(() => {
    return cart.items.reduce((acc, it) => acc + Number(it.preco || 0) * Number(it.qtd || 0), 0);
  }, [cart.items]);

  const total = subtotal + taxaEntrega;

  const canCheckout = useMemo(() => {
    if (!cart.items.length) return false;
    if (!clienteNome.trim()) return false;
    if (onlyDigits(clienteTelefone).length < 10) return false;

    if (tipoEntrega === "ENTREGA") {
      if (!endereco.trim() || !numero.trim() || !bairro.trim()) return false;
    }
    return true;
  }, [cart.items.length, clienteNome, clienteTelefone, tipoEntrega, endereco, numero, bairro]);

  useEffect(() => {
    if (!open) return;
    setPedidoCriado(null);
  }, [open]);

  function clearCartSafe() {
    if (typeof (cart as any).clear === "function") (cart as any).clear();
    else cart.items.forEach((it) => cart.remove(it.ean));
  }

  // 🔎 Busca estoque consolidado da VIEW por EAN
  async function getEstoqueByEan(eans: string[]) {
    const clean = Array.from(new Set(eans.map((x) => (x || "").trim()).filter(Boolean)));
    if (!clean.length) return new Map<string, number>();

    const { data, error } = await supabase
      .from("fv_home_com_estoque") // ✅ sua view consolidada
      .select("ean,estoque_total")
      .in("ean", clean);

    if (error) throw error;

    const map = new Map<string, number>();
    for (const row of (data || []) as any[]) {
      map.set(String(row.ean), Number(row.estoque_total || 0));
    }
    return map;
  }

  async function criarPedido(payload: any) {
    const { data, error } = await supabase.from(PEDIDOS_TABLE).insert(payload).select("id").single();
    if (error) throw error;
    return String((data as any).id || "");
  }

  async function finalizarPedido() {
    if (!canCheckout || saving) return;

    setSaving(true);
    try {
      const grupoId = (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : undefined) || undefined;

      // 1) estoque consolidado
      const eans = cart.items.map((i) => i.ean);
      const estoqueMap = await getEstoqueByEan(eans);

      // 2) separa itens (opção 2)
      const pronta: any[] = [];
      const encomenda: any[] = [];

      for (const i of cart.items) {
        const est = Number(estoqueMap.get(i.ean) ?? 0);
        const qtd = Number(i.qtd || 0);

        const item = {
          ean: i.ean,
          nome: i.nome,
          qtd,
          preco: i.preco,
          subtotal: Number(i.preco || 0) * qtd,
          estoque_total: est,
        };

        if (est >= qtd && qtd > 0) pronta.push(item);
        else encomenda.push(item);
      }

      // 3) base do pedido (dados do cliente)
      const base = {
        grupo_id: grupoId ?? null,
        cliente_nome: clienteNome.trim(),
        cliente_whatsapp: onlyDigits(clienteTelefone),

        tipo_entrega: tipoEntrega,
        endereco: tipoEntrega === "ENTREGA" ? endereco.trim() : null,
        numero: tipoEntrega === "ENTREGA" ? numero.trim() : null,
        bairro: tipoEntrega === "ENTREGA" ? bairro.trim() : null,

        pagamento,
        canal: "SITE",
        status: "NOVO",
      };

      // 4) cria 1 ou 2 pedidos
      const created: { pronto?: string; encomenda?: string; grupo?: string } = { grupo: grupoId };

      // PRONTA ENTREGA
      if (pronta.length) {
        const subPronto = pronta.reduce((acc, it) => acc + Number(it.subtotal || 0), 0);
        const totalPronto = subPronto + taxaEntrega;

        created.pronto = await criarPedido({
          ...base,
          pedido_tipo: "PRONTA_ENTREGA",
          taxa_entrega: taxaEntrega,
          subtotal: subPronto,
          total: totalPronto,
          itens: pronta,
        });
      }

      // ENCOMENDA
      if (encomenda.length) {
        const subEnc = encomenda.reduce((acc, it) => acc + Number(it.subtotal || 0), 0);
        const totalEnc = subEnc + taxaEntrega;

        created.encomenda = await criarPedido({
          ...base,
          pedido_tipo: "ENCOMENDA",
          taxa_entrega: taxaEntrega,
          subtotal: subEnc,
          total: totalEnc,
          itens: encomenda,
        });
      }

      setPedidoCriado(created);
      clearCartSafe();
    } catch (e: any) {
      console.error(e);
      alert("Não consegui finalizar o pedido. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl flex flex-col">
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
          {pedidoCriado ? (
            <div className="rounded-2xl border bg-green-50 p-4 mb-4">
              <div className="text-lg font-extrabold text-green-700">Pedido finalizado com sucesso ✅</div>

              <div className="text-sm text-gray-800 mt-2 space-y-1">
                {pedidoCriado.pronto ? (
                  <div>
                    <b>Pronta entrega:</b> {pedidoCriado.pronto}
                  </div>
                ) : null}
                {pedidoCriado.encomenda ? (
                  <div>
                    <b>Encomenda:</b> {pedidoCriado.encomenda}
                  </div>
                ) : null}
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setPedidoCriado(null);
                    onClose();
                  }}
                  className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white py-3 font-extrabold"
                >
                  Voltar para a loja
                </button>
              </div>
            </div>
          ) : null}

          {/* ITENS */}
          {cart.items.length === 0 ? (
            <div className="text-gray-600 bg-gray-50 border rounded-2xl p-4">Seu carrinho está vazio. Adicione itens 😊</div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((it) => (
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

                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-sm line-clamp-2">{it.nome}</div>
                    <div className="text-xs text-gray-500">EAN: {it.ean}</div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="font-extrabold text-blue-900">{brl(it.preco)}</div>
                      <div className="text-xs font-bold text-gray-600">
                        Item: {brl(Number(it.preco || 0) * Number(it.qtd || 0))}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => cart.dec(it.ean)}
                        className="w-10 h-10 rounded-xl border bg-white hover:bg-gray-50 font-extrabold"
                        disabled={saving || !!pedidoCriado}
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
                        disabled={saving || !!pedidoCriado}
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() => cart.remove(it.ean)}
                        className="ml-auto px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-extrabold text-red-600"
                        disabled={saving || !!pedidoCriado}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DADOS */}
          <div className="mt-5 bg-gray-50 border rounded-2xl p-4">
            <div className="font-extrabold text-gray-900">Dados</div>

            <div className="mt-3 space-y-2">
              <input
                placeholder="Nome do cliente"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="w-full border bg-white px-3 py-2.5 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
                disabled={saving || !!pedidoCriado}
              />
              <input
                placeholder="WhatsApp com DDD (ex: 11999999999)"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                className="w-full border bg-white px-3 py-2.5 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
                disabled={saving || !!pedidoCriado}
              />
              <div className="text-[11px] text-gray-500">Dica: informe com DDD. Ex: 11999999999</div>
            </div>
          </div>

          {/* ENTREGA */}
          <div className="mt-4 bg-white border rounded-2xl p-4">
            <div className="font-extrabold text-gray-900">Entrega</div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setTipoEntrega("ENTREGA")}
                className={`flex-1 px-3 py-2.5 rounded-xl font-extrabold ${
                  tipoEntrega === "ENTREGA" ? "bg-blue-700 text-white" : "bg-gray-100 hover:bg-gray-200"
                }`}
                disabled={saving || !!pedidoCriado}
              >
                Entrega
              </button>

              <button
                type="button"
                onClick={() => setTipoEntrega("RETIRADA")}
                className={`flex-1 px-3 py-2.5 rounded-xl font-extrabold ${
                  tipoEntrega === "RETIRADA" ? "bg-blue-700 text-white" : "bg-gray-100 hover:bg-gray-200"
                }`}
                disabled={saving || !!pedidoCriado}
              >
                Retirada
              </button>
            </div>

            {tipoEntrega === "ENTREGA" ? (
              <div className="mt-3 space-y-2">
                <input
                  placeholder="Endereço"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full border bg-white px-3 py-2.5 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
                  disabled={saving || !!pedidoCriado}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Número"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-full border bg-white px-3 py-2.5 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
                    disabled={saving || !!pedidoCriado}
                  />
                  <input
                    placeholder="Bairro"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full border bg-white px-3 py-2.5 rounded-xl outline-none focus:ring-4 focus:ring-blue-100"
                    disabled={saving || !!pedidoCriado}
                  />
                </div>

                <div className="text-sm font-extrabold text-blue-900">Taxa fixa: {brl(taxaEntrega)}</div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-gray-600">
                Você pode retirar na loja. Assim que confirmar, enviamos o endereço/horário.
              </div>
            )}
          </div>

          {/* PAGAMENTO */}
          <div className="mt-4 bg-white border rounded-2xl p-4">
            <div className="font-extrabold text-gray-900">Pagamento</div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(["PIX", "CARTAO", "DINHEIRO", "COMBINAR"] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPagamento(p)}
                  className={`px-3 py-2 rounded-xl font-extrabold ${
                    pagamento === p ? "bg-blue-700 text-white" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  disabled={saving || !!pedidoCriado}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Subtotal</div>
            <div className="text-lg font-extrabold text-blue-900">{brl(subtotal)}</div>
          </div>

          <div className="mt-1 flex items-center justify-between">
            <div className="text-sm text-gray-600">Taxa</div>
            <div className="text-sm font-extrabold">{brl(taxaEntrega)}</div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="text-base font-extrabold text-gray-900">Total</div>
            <div className="text-xl font-extrabold text-green-700">{brl(total)}</div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={clearCartSafe}
              className="px-4 py-3 rounded-2xl border bg-white hover:bg-gray-50 font-extrabold"
              disabled={!cart.items.length || saving || !!pedidoCriado}
            >
              Limpar
            </button>

            <button
              type="button"
              disabled={!canCheckout || saving || !!pedidoCriado}
              onClick={finalizarPedido}
              className={`px-4 py-3 rounded-2xl font-extrabold text-center ${
                canCheckout ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-200 text-gray-500"
              } ${saving ? "opacity-70 cursor-wait" : ""}`}
            >
              {saving ? "Finalizando..." : "Finalizar pedido"}
            </button>
          </div>

          {!canCheckout ? (
            <div className="mt-2 text-xs text-gray-500">
              Para liberar: informe <b>Nome</b>, <b>WhatsApp</b> e adicione itens. Se escolher <b>Entrega</b>,
              preencha <b>Endereço/Número/Bairro</b>.
            </div>
          ) : null}
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      {/* IMAGEM + TAGS */}
      <div className="relative p-3">
        <Link href={hrefProduto} className="bg-gray-50 rounded-xl p-2 flex items-center justify-center hover:opacity-95 transition">
          <Image
            src={firstImg(p.imagens)}
            alt={p.nome || "Produto"}
            width={240}
            height={240}
            className="rounded object-contain h-24 sm:h-28"
          />
        </Link>

        {/* OFF */}
        {pr.emPromo && pr.off > 0 ? (
          <span className="absolute top-3 right-3 text-[11px] font-extrabold bg-red-600 text-white px-2 py-1 rounded-full shadow-sm">
            {pr.off}% OFF
          </span>
        ) : null}

        {/* ESTOQUE */}
        <span
          className={`absolute top-3 left-3 text-[11px] font-extrabold px-2 py-1 rounded-full shadow-sm ${
            disponivel ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
          title={disponivel ? "Disponível" : "Sem estoque nas parceiras"}
        >
          {disponivel ? `Estoque: ${estoque}` : "Sem estoque"}
        </span>
      </div>

      {/* INFO */}
      <div className="px-3 pb-3 flex-1 flex flex-col">
        <div className="text-[11px] text-gray-500 line-clamp-1">{p.laboratorio || "—"}</div>

        <Link href={hrefProduto} className="mt-1 font-semibold text-blue-950 text-xs sm:text-sm line-clamp-2 hover:underline">
          {p.nome}
        </Link>

        {p.apresentacao ? <div className="text-[11px] text-gray-600 mt-1 line-clamp-1">{p.apresentacao}</div> : null}

        {/* PREÇO */}
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

        {/* AÇÕES */}
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
            {disponivel ? "Comprar" : "Encomendar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ✅ OPÇÃO 3 (MOBILE/TABLET): faixa "Serviços rápidos"
 * - aparece só em telas menores que xl
 * - chama WhatsApp com mensagem pronta
 *
 * COMO USAR:
 * Dentro do seu <section ...> antes da grid, coloque:
 * <ServiceQuickAds />
 */
function ServiceQuickAds() {
  const base = "/servicos/agenda";
  const link = (servico: string) => `${base}?servico=${encodeURIComponent(servico)}`;

  const cards = [
    {
      key: "pressao",
      title: "Aferição de Pressão",
      subtitle: "Rápido e prático",
      href: link("Aferição de Pressão Arterial"),
      emoji: "🩺",
      gradient: "from-blue-600 to-blue-400",
    },
    {
      key: "glicemia",
      title: "Teste de Glicemia",
      subtitle: "Resultado na hora",
      href: link("Teste de Glicemia"),
      emoji: "🩸",
      gradient: "from-orange-500 to-amber-400",
    },
    {
      key: "injecao",
      title: "Aplicação de Injeção",
      subtitle: "Com profissional",
      href: link("Aplicação de Injeção"),
      emoji: "💉",
      gradient: "from-emerald-600 to-green-400",
    },
    {
      key: "revisao",
      title: "Revisão de Medicamentos",
      subtitle: "Mais segurança",
      href: link("Revisão de Medicamentos"),
      emoji: "📋",
      gradient: "from-indigo-600 to-sky-400",
    },
  ];

  return (
    <div className="xl:hidden mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-extrabold text-sm text-gray-900">Serviços</div>
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
                <span className="text-[11px] font-extrabold bg-white/15 px-2 py-1 rounded-full">
                  Agendar
                </span>
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
