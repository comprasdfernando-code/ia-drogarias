"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import ProductCard, { Product } from "./_components/ProductCard";
import CartModal from "./_components/CartModal";
import { useCartUI } from "./_components/CartProvider";

export default function Glow10EcommerceHome() {
  const { items, openCart } = useCartUI();

  const cartCount = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.quantidade) || 0), 0),
    [items]
  );

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
          .from("mk_produtos")
          .select("id,nome,marca,preco,quantidade,foto_url,created_at,ativo")
          .eq("ativo", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const list: Product[] = (data || []).map((p: any) => ({
          id: String(p.id),
          nome: String(p.nome ?? ""),
          marca: p.marca ?? null,
          preco: Number(p.preco ?? 0),
          estoque: Number(p.quantidade ?? 0),
          foto_url: p.foto_url ?? null,
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

  const filtered: Product[] = useMemo(() => {
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
      {/* ✅ modal (abre pelo botão) */}
      <CartModal mode="ECOMMERCE" />

      <header className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-2xl font-extrabold">Glow10 — maquiagem premium</div>
          <div className="text-white/60 text-sm">Estilo “farmácia virtual” • só entrega</div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/loja/glow10/pdv" className="rounded-xl px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15">
            PDV
          </Link>
          <button
            onClick={openCart}
            className="rounded-2xl bg-white text-black font-bold px-5 py-3"
          >
            Carrinho ({cartCount})
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar maquiagem premium..."
            className="w-full rounded-2xl bg-zinc-900/40 border border-white/10 px-5 py-4 outline-none focus:border-white/20 placeholder:text-white/40"
          />
        </div>

        <div className="pt-4 text-sm text-white/60">
          {loading ? "Carregando..." : `${filtered.length} produto(s)`}
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {err}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </main>
    </div>
  );
}
