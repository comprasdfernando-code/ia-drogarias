"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

import CartDrawer from "./_components/CartDrawer";
import { CartProvider, useCart } from "./_components/cart";

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
  if (Array.isArray(imagens) && imagens.length > 0) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function buildWhatsAppLink(numeroE164: string, msg: string) {
  const clean = numeroE164.replace(/\D/g, "");
  const text = encodeURIComponent(msg);
  return `https://wa.me/${clean}?text=${text}`;
}

export default function Page() {
  return (
    <CartProvider>
      <FarmaciaVirtualHome />
    </CartProvider>
  );
}

function FarmaciaVirtualHome() {
  const [cartOpen, setCartOpen] = useState(false);

  const [loadingHome, setLoadingHome] = useState(true);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [busca, setBusca] = useState("");

  const [homeProdutos, setHomeProdutos] = useState<FVProduto[]>([]);
  const [resultado, setResultado] = useState<FVProduto[]>([]);

  const textoAviso =
    "Finalização do pedido: nós analisamos a disponibilidade e retornamos em poucos minutos para confirmar.";

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

        if (digits.length >= 8 && digits.length <= 14) {
          query = query.or(`ean.eq.${digits},nome.ilike.%${t}%`);
        } else {
          query = query.ilike("nome", `%${t}%`);
        }

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
      {/* HEADER */}
      <header className="bg-gradient-to-b from-blue-700 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                Farmácia Virtual <span className="text-white/80">— IA Drogarias</span>
              </h1>
              <p className="text-white/90 text-sm md:text-base max-w-3xl mt-2">
                {textoAviso}
              </p>
            </div>

            {/* BOTÃO CARRINHO */}
            <CartButton onClick={() => setCartOpen(true)} />
          </div>

          {/* Search */}
          <div className="mt-6 bg-white/10 backdrop-blur rounded-2xl p-3 md:p-4 border border-white/15">
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Digite o nome ou EAN..."
                  className="w-full bg-white text-gray-900 placeholder:text-gray-400 rounded-xl px-4 py-3 shadow-sm outline-none focus:ring-2 focus:ring-white/60"
                />
              </div>

              <a
                href={buildWhatsAppLink(WHATSAPP, "Olá! Quero tirar uma dúvida na Farmácia Virtual.")}
                className="shrink-0 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-extrabold shadow-sm"
              >
                WhatsApp
              </a>
            </div>

            {isSearching && (
              <div className="mt-2 text-xs text-white/90">
                {loadingBusca ? "Buscando…" : " "}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <section className="max-w-6xl mx-auto px-4">
        {isSearching ? (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Resultados <span className="text-gray-500">({resultado.length})</span>
              </h2>

              <button
                onClick={() => setBusca("")}
                className="text-sm text-blue-700 hover:underline"
              >
                Limpar busca
              </button>
            </div>

            {loadingBusca ? (
              <GridSkeleton />
            ) : resultado.length === 0 ? (
              <div className="bg-white border rounded-2xl p-6 text-gray-600">
                Nenhum produto encontrado.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
                {resultado.map((p) => (
                  <ProdutoCard key={p.id} p={p} onOpenCart={() => setCartOpen(true)} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {loadingHome ? (
              <GridSkeleton />
            ) : categoriasHome.length === 0 ? (
              <div className="bg-white border rounded-2xl p-6 text-gray-600">
                Nenhum produto para exibir.
              </div>
            ) : (
              categoriasHome.map(([cat, itens]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-1.5 rounded-full bg-blue-600" />
                      <h2 className="text-lg font-extrabold text-gray-900">{cat}</h2>
                    </div>

                    <Link
                      href={`/fv/categoria/${encodeURIComponent(cat)}`}
                      className="text-sm text-blue-700 hover:underline"
                    >
                      Ver todos →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
                    {itens.map((p) => (
                      <ProdutoCard key={p.id} p={p} onOpenCart={() => setCartOpen(true)} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* DRAWER */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        whatsapp={WHATSAPP}
        taxaEntrega={TAXA_ENTREGA}
      />
    </main>
  );
}

function CartButton({ onClick }: { onClick: () => void }) {
  const { countItems } = useCart();

  return (
    <button
      onClick={onClick}
      className="relative shrink-0 bg-white/15 hover:bg-white/20 border border-white/20 rounded-2xl px-4 py-3 font-extrabold"
      title="Abrir carrinho"
    >
      🛒 Carrinho
      {countItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-green-400 text-blue-950 text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center shadow">
          {countItems}
        </span>
      )}
    </button>
  );
}

function ProdutoCard({ p, onOpenCart }: { p: FVProduto; onOpenCart: () => void }) {
  const pr = precoFinal(p);
  const { addItem } = useCart();

  function handleAdd() {
    if (!p.ean) return;
    addItem(
      {
        ean: p.ean,
        nome: p.nome,
        laboratorio: p.laboratorio,
        apresentacao: p.apresentacao,
        imagem: firstImg(p.imagens),
        preco: pr.final || 0,
      },
      1
    );
    onOpenCart();
  }

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
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

        {p.destaque_home && (
          <span className="absolute top-3 left-3 text-[11px] font-bold bg-blue-700 text-white px-2 py-1 rounded-full shadow-sm">
            Destaque
          </span>
        )}
      </div>

      <div className="px-3 pb-3 flex-1 flex flex-col">
        <div className="text-[11px] text-gray-500 line-clamp-1">
          {p.laboratorio || "—"}
        </div>

        <h3 className="mt-1 font-semibold text-blue-950 text-xs sm:text-sm line-clamp-2">
          {p.nome}
        </h3>

        {p.apresentacao && (
          <div className="text-[11px] text-gray-600 mt-1 line-clamp-1">
            {p.apresentacao}
          </div>
        )}

        <div className="mt-2">
          {pr.emPromo ? (
            <>
              <div className="text-xs text-gray-500">
                De <span className="line-through">{brl(pr.pmc)}</span>
              </div>
              <div className="text-base font-extrabold text-blue-900">
                Por {brl(pr.final)}
              </div>
            </>
          ) : (
            <div className="text-base font-extrabold text-blue-900">{brl(pr.final)}</div>
          )}
        </div>

        {/* AÇÕES */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={handleAdd}
            className="bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-xs sm:text-sm font-extrabold"
          >
            Adicionar
          </button>

          <Link
            href={`/fv/produtos/${p.ean}`}
            className="text-center border border-blue-700 hover:bg-blue-50 text-blue-800 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold"
          >
            Ver
          </Link>
        </div>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
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
