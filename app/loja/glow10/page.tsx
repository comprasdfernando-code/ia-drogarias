"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

import HeaderPremium from "./_components/HeaderPremium";
import HeroPremium from "./_components/HeroPremium";
import ProductCard from "./_components/ProductCard";
import { CartUIProvider } from "./_components/CartProvider";
import CartModal from "./_components/CartModal";

type Produto = {
  id: string;
  nome: string;
  marca: string | null;
  categoria: string | null;
  foto_url: string | null;
  preco: number;
  preco_promocional: number | null;
  promo_ativa: boolean;
  quantidade: number;
  ativo: boolean;
};

export default function Glow10Home() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("mk_produtos")
        .select("id,nome,marca,categoria,foto_url,preco,preco_promocional,promo_ativa,quantidade,ativo")
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && data) setProdutos(data as any);
      setLoading(false);
    })();
  }, []);

  const filtrados = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return produtos;
    return produtos.filter((p) => {
      const nome = (p.nome || "").toLowerCase();
      const marca = (p.marca || "").toLowerCase();
      const cat = (p.categoria || "").toLowerCase();
      return nome.includes(s) || marca.includes(s) || cat.includes(s);
    });
  }, [q, produtos]);

  return (
    <CartUIProvider>
      <div className="min-h-screen bg-black text-white">
        <HeaderPremium />
        <HeroPremium />

        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar maquiagem premium…"
              className="w-full rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-white/30"
            />
            <CartModal />
          </div>

          <div className="mt-3 text-sm text-white/60">
            {loading ? "Carregando produtos…" : `${filtrados.length} produto(s)`}
          </div>

          <div id="produtos" className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtrados.map((p) => (
              <Link key={p.id} href={`/loja/glow10/produto/${p.id}`} className="block">
                <ProductCard p={p} />
              </Link>
            ))}
          </div>

          {!loading && filtrados.length === 0 && (
            <div className="mt-10 text-center text-white/70">Nenhum produto encontrado.</div>
          )}
        </div>
      </div>
    </CartUIProvider>
  );
}
