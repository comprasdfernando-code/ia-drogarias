"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "./_components/cart";
import { ToastProvider, useToast } from "./_components/toast";
import FVBanners from "./_components/FVBanners";

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

function waLink(phone: string, msg: string) {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

export default function FarmaciaVirtualHomePage() {
  return (
    <ToastProvider>
      <FarmaciaVirtualHome />
    </ToastProvider>
  );
}

function FarmaciaVirtualHome() {
  const [loadingHome, setLoadingHome] = useState(true);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [busca, setBusca] = useState("");

  const [homeProdutos, setHomeProdutos] = useState<FVProduto[]>([]);
  const [resultado, setResultado] = useState<FVProduto[]>([]);

  // ✅ Modal do carrinho agora é local (não depende de open())
  const [cartOpen, setCartOpen] = useState(false);

  const cart = useCart();
  const totalCarrinho = cart.subtotal;
  const qtdCarrinho = cart.countItems;

  useEffect(() => {
    async function loadHome() {
      try {
        setLoadingHome(true);
        const { data, error } = await supabase
          .from("fv_produtos")
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens"
          )
          .eq("ativo", true)
          .limit(2500);

        if (error) throw error;

        const arr = (data || []) as FVProduto[];
        arr.sort((a, b) => {
          const da = a.destaque_home ? 1 : 0;
          const db = b.destaque_home ? 1 : 0;
          if (db !== da) return db - da;

          const pa = a.em_promocao ? 1 : 0;
          const pb = b.em_promocao ? 1 : 0;
          if (pb !== pa) return pb - pa;

          const ca = (a.categoria || "Outros").toLowerCase();
          const cb = (b.categoria || "Outros").toLowerCase();
          const ccmp = ca.localeCompare(cb);
          if (ccmp !== 0) return ccmp;

          return (a.nome || "").localeCompare(b.nome || "");
        });

        setHomeProdutos(arr);
      } catch (e) {
        console.error("Erro loadHome:", e);
      } finally {
        setLoadingHome(false);
      }
    }

    loadHome();
  }, []);

  useEffect(() => {
    async function search() {
      const t = busca.trim();
      if (!t) {
        setResultado([]);
        return;
      }

      setLoadingBusca(true);
      try {
        const digits = t.replace(/\D/g, "");
        let query = supabase
          .from("fv_produtos")
          .select(
            "id,ean,nome,laboratorio,categoria,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,destaque_home,ativo,imagens"
          )
          .eq("ativo", true)
          .limit(100);

        if (digits.length >= 8 && digits.length <= 14) query = query.or(`ean.eq.${digits},nome.ilike.%${t}%`);
        else query = query.ilike("nome", `%${t}%`);

        const { data, error } = await query;
        if (error) throw error;

        const ordered = ((data || []) as FVProduto[]).sort((a, b) => {
          const pa = a.em_promocao ? 1 : 0;
          const pb = b.em_promocao ? 1 : 0;
          if (pb !== pa) return pb - pa;
          return (a.nome || "").localeCompare(b.nome || "");
        });

        setResultado(ordered);
      } catch (e) {
        console.error("Erro search:", e);
      } finally {
        setLoadingBusca(false);
      }
    }

    const timer = setTimeout(search, 350);
    return () => clearTimeout(timer);
  }, [busca]);

  const categoriasHome = useMemo(() => {
    if (busca.trim()) return [];
    const map = new Map<string, FVProduto[]>();
    for (const p of homeProdutos) {
      const cat = (p.categoria || "Outros").trim() || "Outros";
      if (!map.has(cat)) map.set(cat, []);
      const arr = map.get(cat)!;
      if (arr.length < 6) arr.push(p);
    }
    return Array.from(map.entries()).slice(0, 6);
  }, [homeProdutos, busca]);

  const isSearching = !!busca.trim();

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* ✅ HEADER AZUL STICKY (BUSCA + CARRINHO) */}
      {/* ✅ HEADER AZUL STICKY (DESKTOP 1 LINHA / MOBILE 2 LINHAS) */}
<header className="sticky top-0 z-40 bg-blue-700 shadow">
  <div className="mx-auto max-w-6xl px-4 py-3">
    {/* MOBILE: linha 1 (logo + carrinho) */}
    <div className="flex items-center justify-between gap-3 md:hidden">
      <div className="text-white font-extrabold whitespace-nowrap">
        IA Drogarias <span className="opacity-80">• FV</span>
      </div>

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
    </div>

    {/* MOBILE: linha 2 (busca grande) */}
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
              onClick={() => setBusca("")}
              className="text-xs font-extrabold px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
              title="Limpar"
            >
              Limpar
            </button>
          ) : null}
          <span className="text-blue-900 bg-green-400/90 px-2 py-1 rounded-full text-xs font-extrabold">
            🔎
          </span>
        </div>
      </div>

      {isSearching && (
        <div className="mt-1 text-[11px] text-white/80">
          {loadingBusca ? "Buscando…" : resultado.length ? `${resultado.length} resultado(s)` : " "}
        </div>
      )}
    </div>

    {/* DESKTOP: tudo na mesma linha (como está no PC) */}
    <div className="hidden md:flex items-center gap-3">
      <div className="text-white font-extrabold whitespace-nowrap">
        IA Drogarias <span className="opacity-80">• FV</span>
      </div>

      <div className="flex-1">
        <div className="relative">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite o nome do medicamento ou EAN..."
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
            <span className="text-blue-900 bg-green-400/90 px-2 py-1 rounded-full text-xs font-extrabold">
              🔎
            </span>
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
    </div>
  </div>
</header>


      {/* ✅ BANNERS (voltou) */}
      <div className="mt-4">
        <FVBanners />
      </div>

      {/* CONTEÚDO */}
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
                  <ProdutoCardUltra key={p.id} p={p} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {loadingHome ? (
              <GridSkeleton />
            ) : (
              categoriasHome.map(([cat, itens]) => (
                <div key={cat}>
                  <div className="flex justify-end mb-2">
  <Link
    href={`/fv/categoria/${encodeURIComponent(cat)}`}
    className="text-sm text-blue-700 hover:underline"
  >
    Ver todos →
  </Link>
</div>


                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
                    {itens.map((p) => (
                      <ProdutoCardUltra key={p.id} p={p} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* ✅ “COMPRA RÁPIDA” SOMENTE NO FINAL */}
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
                <div className="text-sm text-gray-600">Taxa fixa e prazo até 24h</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border p-4 bg-gray-50">
            <div className="text-xs uppercase tracking-wide text-gray-500 font-bold">Dica</div>
            <div className="font-extrabold text-gray-900">Pesquise pelo nome ou EAN pra achar rapidinho.</div>
          </div>
        </div>
      </section>

      {/* ✅ MODAL DO CARRINHO */}
      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} />
    </main>
  );
}

function CartModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useCart();

  // coloque aqui o WhatsApp da farmácia (E164 ou com DDD)
  const WHATS = "5511952068432";

  const mensagem = useMemo(() => {
    if (!cart.items.length) return "Olá! Quero fazer um pedido na Farmácia Virtual.";
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
            Fechar
          </button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          {cart.items.length === 0 ? (
            <div className="text-gray-600 bg-gray-50 border rounded-2xl p-4">
              Seu carrinho está vazio. Adicione alguns itens 😊
            </div>
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

                  <div className="flex-1">
                    <div className="font-extrabold text-sm line-clamp-2">{it.nome}</div>
                    <div className="text-xs text-gray-500">EAN: {it.ean}</div>
                    <div className="mt-1 font-extrabold text-blue-900">{brl(it.preco)}</div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center border rounded-xl overflow-hidden">
                        <button
                          onClick={() => cart.dec(it.ean)}
                          className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold"
                        >
                          –
                        </button>
                        <div className="w-10 text-center font-extrabold text-sm">{it.qtd}</div>
                        <button
                          onClick={() => cart.inc(it.ean)}
                          className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => cart.remove(it.ean)}
                        className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-extrabold"
                        title="Remover item"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
              href={waLink(WHATS, mensagem)}
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

function ProdutoCardUltra({ p }: { p: FVProduto }) {
  const pr = precoFinal(p);
  const { addItem } = useCart();
  const { push } = useToast();
  const [qtd, setQtd] = useState(1);

  function add() {
    addItem(
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

    push({
      title: "Adicionado ao carrinho ✅",
      desc: `${p.nome} • ${qtd}x`,
    });

    setQtd(1);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      <div className="relative p-3">
        <div className="bg-gray-50 rounded-xl p-2 flex items-center justify-center">
          <Image
            src={firstImg(p.imagens)}
            alt={p.nome || "Produto"}
            width={240}
            height={240}
            className="rounded object-contain h-24 sm:h-28"
          />
        </div>

        {pr.emPromo && pr.off > 0 && (
          <span className="absolute top-3 right-3 text-[11px] font-extrabold bg-red-600 text-white px-2 py-1 rounded-full shadow-sm">
            {pr.off}% OFF
          </span>
        )}
      </div>

      <div className="px-3 pb-3 flex-1 flex flex-col">
        <div className="text-[11px] text-gray-500 line-clamp-1">{p.laboratorio || "—"}</div>

        <Link href={`/fv/produtos/${p.ean}`} className="mt-1 font-semibold text-blue-950 text-xs sm:text-sm line-clamp-2 hover:underline">
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

        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center border rounded-xl overflow-hidden">
            <button
              onClick={() => setQtd((x) => Math.max(1, x - 1))}
              className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold"
            >
              –
            </button>
            <div className="w-10 text-center font-extrabold text-sm">{qtd}</div>
            <button
              onClick={() => setQtd((x) => x + 1)}
              className="w-9 h-9 bg-white hover:bg-gray-50 font-extrabold"
            >
              +
            </button>
          </div>

          <button
            onClick={add}
            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-xs sm:text-sm font-extrabold"
          >
            Comprar
          </button>
        </div>
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
