"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CartProvider, useCart } from "../../ninhocar/_components/CartContext";
import CartModal from "../../ninhocar/_components/CartModal";
import ProductCard from "../../ninhocar/_components/ProductCard";

type Produto = {
  id: string;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  preco: number;
  estoque: number;
  imagem_url?: string | null;
  ativo: boolean;
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function LojaInner() {
  const cart = useCart();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("TODOS");
  const [cartOpen, setCartOpen] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ninhocar_produtos")
      .select("id,nome,descricao,categoria,preco,estoque,imagem_url,ativo")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (!error && data) setProdutos(data as any);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    produtos.forEach((p) => p.categoria && set.add(p.categoria));
    return ["TODOS", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [produtos]);

  const lista = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return produtos.filter((p) => {
      const okCat = cat === "TODOS" ? true : (p.categoria || "") === cat;
      const okQ =
        !qq ||
        p.nome.toLowerCase().includes(qq) ||
        (p.descricao || "").toLowerCase().includes(qq);
      return okCat && okQ;
    });
  }, [produtos, q, cat]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-black text-gray-900 leading-tight">Ninho Car • Loja</div>
            <div className="text-xs text-gray-500">Auto Elétrica e Conveniência</div>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            className="px-4 py-2 rounded-xl bg-black text-white font-bold text-sm"
          >
            Carrinho ({cart.count}) • {brl(Number(cart.subtotal))}
          </button>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-3 flex flex-col md:flex-row gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full md:flex-1 border rounded-xl px-3 py-2 text-sm"
          />

          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="w-full md:w-64 border rounded-xl px-3 py-2 text-sm"
          >
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={load}
            className="w-full md:w-auto px-4 py-2 rounded-xl border text-sm font-semibold"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-sm text-gray-500">Carregando produtos...</div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-3">
              {lista.length} item(ns) encontrado(s)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lista.map((p) => (
                <ProductCard key={p.id} p={p as any} />
              ))}
            </div>

            {lista.length === 0 ? (
              <div className="mt-6 text-sm text-gray-500">Nenhum produto encontrado.</div>
            ) : null}
          </>
        )}
      </div>

      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

export default function Page() {
  return (
    <CartProvider>
      <LojaInner />
    </CartProvider>
  );
}
