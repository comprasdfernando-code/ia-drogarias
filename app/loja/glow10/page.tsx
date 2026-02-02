"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

import HeaderPremium from "./_components/HeaderPremium";
import HeroPremium from "./_components/HeroPremium";
import ProductCard from "./_components/ProductCard";
import CartModal from "./_components/CartModal";
import { useCart } from "./_components/CartProvider";

type Product = {
  id: string;
  nome: string;
  marca?: string | null;
  preco: number;
  estoque: number;
  imagem_url?: string | null;
};

const TABLE = "glow10_produtos"; // <<< se sua tabela tiver outro nome, troca aqui

export default function Glow10HomePage() {
  const cart: any = useCart();

  const cartCount =
    cart?.items?.reduce?.((acc: number, it: any) => acc + (Number(it?.qty) || 0), 0) ??
    cart?.items?.length ??
    0;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const { data, error } = await supabase
          .from(TABLE)
          .select("id,nome,marca,preco,estoque,imagem_url,created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const list: Product[] = (data || []).map((p: any) => ({
          id: String(p.id),
          nome: String(p.nome ?? ""),
          marca: p.marca ?? null,
          preco: Number(p.preco ?? 0),
          estoque: Number(p.estoque ?? 0),
          imagem_url: p.imagem_url ?? null,
        }));

        if (alive) setProducts(list);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Erro ao carregar produtos.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = (q || "").trim().toLowerCase();
    if (!s) return products;

    return products.filter((p) => {
      const nome = (p.nome || "").toLowerCase();
      const marca = (p.marca || "").toLowerCase();
      return nome.includes(s) || marca.includes(s);
    });
  }, [products, q]);

  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderPremium />
      <HeroPremium />

      {/* ✅ Modal do carrinho */}
      <CartModal />

      <div className="max-w-6xl mx-auto px-4 pb-16">
        {/* Top bar: busca + carrinho */}
        <div className="flex items-center justify-between gap-3 pt-6">
          <div className="flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar maquiagem premium..."
              className="w-full rounded-2xl bg-zinc-900/40 border border-white/10 px-5 py-4
                         outline-none focus:border-white/20 placeholder:text-white/40"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              // tenta abrir conforme seu provider (se existir)
              if (typeof cart?.open === "function") cart.open();
              if (typeof cart?.setOpen === "function") cart.setOpen(true);
            }}
            className="shrink-0 rounded-2xl bg-white text-black font-bold px-6 py-4"
            title="Abrir carrinho"
          >
            Carrinho ({cartCount})
          </button>
        </div>

        {/* Status */}
        <div className="pt-4 text-sm text-white/60">
          {loading ? "Carregando produtos..." : `${filtered.length} produto(s)`}
        </div>

        {/* Erro */}
        {err ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {err}
          </div>
        ) : null}

        {/* Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {/* Links rápidos */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/loja/glow10/admin"
            className="rounded-xl px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15"
          >
            Admin
          </Link>
          <Link
            href="/loja/glow10/painel"
            className="rounded-xl px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15"
          >
            Painel
          </Link>
          <Link
            href="/loja/glow10/caixa"
            className="rounded-xl px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15"
          >
            Caixa
          </Link>
        </div>
      </div>
    </div>
  );
}
