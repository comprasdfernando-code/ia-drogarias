"use client";

import { useEffect, useState } from "react";
import ProductCard from "./components/ProductCard";
import CartButton from "./components/CartButton";
import { supabase } from "@/lib/supabaseClient";

export default function LojinhaPage() {
  const [produtos, setProdutos] = useState([]);

  async function carregar() {
    const { data } = await supabase
      .from("produtos_loja")
      .select("*")
      .order("id", { ascending: false });

    setProdutos(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="p-4">
      
      <h1 className="text-3xl font-bold text-yellow-400 mb-4">
        Lojinha da Oportunidade 💛🖤
      </h1>

      {/* GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {produtos.map(item => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>

      <CartButton />
    </main>
  );
}
