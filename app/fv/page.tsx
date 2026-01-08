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
      {/* TOPO */}
      <section className="max-w-6xl mx-auto px-4 pt-6">
        <div className="bg-white border rounded-3xl p-4 md:p-5 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-900">
            Farmácia Virtual — IA Drogarias
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Finalização do pedido: nós analisamos a disponibilidade e retornamos em poucos minutos para confirmar.
          </p>

          <div className="mt-4 flex gap-2 items-center">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite o nome ou EAN..."
              className="w-full bg-gray-50 border rounded-2xl px-4 py-3 shadow-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              onClick={() => setBusca("")}
              className="px-4 py-3 rounded-2xl border bg-white hover:bg-gray-50 font-semibold"
            >
              Limpar
            </button>
          </div>

          {isSearching && <div className="mt-2 text-xs text-gray-500">{loadingBusca ? "Buscando…" : " "}</div>}
        </div>
      </section>

      {/* ✅ BANNERS: AGORA FICA AQUI (SEMPRE APARECE) */}
      <FVBanners />

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
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-extrabold text-gray-900">{cat}</h2>
                    <Link href={`/fv/categoria/${encodeURIComponent(cat)}`} className="text-sm text-blue-700 hover:underline">
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
    </main>
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
