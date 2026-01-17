"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

import { useCart } from "./_components/cart";
import { ToastProvider, useToast } from "./_components/toast";
import { CartUIProvider, useCartUI } from "./_components/cart-ui";
import FVBanners from "./_components/FVBanners";

/* =======================
   TIPOS
======================= */
type FVProduto = {
  id: string;
  ean: string;
  nome: string;
  laboratorio: string | null;
  apresentacao: string | null;
  pmc: number | null;
  em_promocao: boolean | null;
  preco_promocional: number | null;
  percentual_off: number | null;
  ativo: boolean | null;
  imagens: string[] | null;
};

/* =======================
   HELPERS
======================= */
function brl(v?: number | null) {
  if (!v) return "—";
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function firstImg(imagens?: string[] | null) {
  if (Array.isArray(imagens) && imagens[0]) return imagens[0];
  return "/produtos/caixa-padrao.png";
}

function calcOff(pmc?: number | null, promo?: number | null) {
  if (!pmc || !promo || promo >= pmc) return 0;
  return Math.round(((pmc - promo) / pmc) * 100);
}

function precoFinal(p: FVProduto) {
  const pmc = Number(p.pmc || 0);
  const promo = Number(p.preco_promocional || 0);
  const emPromo = !!p.em_promocao && promo > 0 && promo < pmc;
  const final = emPromo ? promo : pmc;
  const off =
    emPromo && p.percentual_off
      ? p.percentual_off
      : calcOff(pmc, promo);

  return { emPromo, pmc, final, off };
}

/* =======================
   PAGE
======================= */
export default function FarmaciaVirtualHomePage() {
  return (
    <ToastProvider>
      <CartUIProvider>
        <HomeFV />
      </CartUIProvider>
    </ToastProvider>
  );
}

/* =======================
   HOME FV (SEM CATEGORIA)
======================= */
function HomeFV() {
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [produtos, setProdutos] = useState<FVProduto[]>([]);
  const [resultado, setResultado] = useState<FVProduto[]>([]);

  const cart = useCart();
  const { cartOpen, openCart, closeCart } = useCartUI();

  /* ===== LOAD HOME ===== */
  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("fv_produtos")
        .select(
          "id,ean,nome,laboratorio,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,ativo,imagens"
        )
        .eq("ativo", true)
        .limit(3000);

      if (!error) setProdutos(data || []);
      setLoading(false);
    }

    load();
  }, []);

  /* ===== BUSCA ===== */
  useEffect(() => {
    if (!busca.trim()) {
      setResultado([]);
      return;
    }

    const timer = setTimeout(async () => {
      const q = busca.trim().toLowerCase();

      const { data } = await supabase
        .from("fv_produtos")
        .select(
          "id,ean,nome,laboratorio,apresentacao,pmc,em_promocao,preco_promocional,percentual_off,ativo,imagens"
        )
        .eq("ativo", true)
        .or(`nome.ilike.%${q}%,ean.ilike.%${q}%`)
        .limit(120);

      setResultado(data || []);
    }, 350);

    return () => clearTimeout(timer);
  }, [busca]);

  const lista = busca.trim() ? resultado : produtos;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-blue-700 shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="text-white font-extrabold">
            IA Drogarias <span className="opacity-80">• FV</span>
          </div>

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar medicamento ou EAN..."
            className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
          />

          <button
            onClick={openCart}
            className="relative bg-white/10 text-white px-4 py-2 rounded-full font-extrabold"
          >
            🛒 {brl(cart.subtotal)}
            {cart.countItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-400 text-blue-900 text-xs px-2 rounded-full">
                {cart.countItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* BANNERS */}
      <div className="mt-4">
        <FVBanners />
      </div>

      {/* GRID ÚNICO */}
      <section className="max-w-6xl mx-auto px-4 mt-6">
        {loading ? (
          <GridSkeleton />
        ) : lista.length === 0 ? (
          <div className="bg-white border rounded-xl p-6 text-gray-600">
            Nenhum produto encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {lista.map((p) => (
              <ProdutoCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      <CartModalPDV open={cartOpen} onClose={closeCart} />
    </main>
  );
}

/* =======================
   CARD
======================= */
function ProdutoCard({ p }: { p: FVProduto }) {
  const { addItem } = useCart();
  const { push } = useToast();
  const pr = precoFinal(p);
  const [qtd, setQtd] = useState(1);

  function comprar() {
    addItem(
      {
        ean: p.ean,
        nome: p.nome,
        laboratorio: p.laboratorio,
        apresentacao: p.apresentacao,
        imagem: firstImg(p.imagens),
        preco: pr.final,
      },
      qtd
    );

    push({
      title: "Adicionado ao carrinho",
      desc: `${p.nome} • ${qtd}x`,
    });

    setQtd(1);
  }

  return (
    <div className="bg-white border rounded-2xl p-3 flex flex-col">
      <Link href={`/fv/produtos/${p.ean}`}>
        <Image
          src={firstImg(p.imagens)}
          alt={p.nome}
          width={200}
          height={200}
          className="h-28 object-contain mx-auto"
        />
      </Link>

      <div className="mt-2 text-xs text-gray-500 line-clamp-1">
        {p.laboratorio}
      </div>

      <div className="text-sm font-semibold line-clamp-2">
        {p.nome}
      </div>

      <div className="mt-2 font-extrabold text-blue-900">
        {brl(pr.final)}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setQtd(Math.max(1, qtd - 1))}
          className="w-8 border rounded"
        >
          –
        </button>
        <div className="w-8 text-center font-bold">{qtd}</div>
        <button
          onClick={() => setQtd(qtd + 1)}
          className="w-8 border rounded"
        >
          +
        </button>
      </div>

      <button
        onClick={comprar}
        className="mt-3 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-xl font-extrabold"
      >
        Comprar
      </button>
    </div>
  );
}

/* =======================
   MODAL PDV (placeholder)
======================= */
function CartModalPDV({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white" />
    </div>
  );
}

/* =======================
   SKELETON
======================= */
function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-64 bg-gray-100 rounded-xl animate-pulse"
        />
      ))}
    </div>
  );
}
