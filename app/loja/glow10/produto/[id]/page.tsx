"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useCartUI } from "../../_components/CartProvider";
import HeaderPremium from "../../_components/HeaderPremium";

type Produto = {
  id: string;
  nome: string;
  marca: string | null;
  descricao: string | null;
  foto_url: string | null;
  preco: number;
  preco_promocional: number | null;
  promo_ativa: boolean;
  quantidade: number;
};

function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProdutoPage() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, openCart } = useCartUI();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("mk_produtos").select("*").eq("id", id).single();
      if (!error && data) setP(data as any);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-black text-white"><HeaderPremium /><div className="p-6">Carregando…</div></div>;
  if (!p) return <div className="min-h-screen bg-black text-white"><HeaderPremium /><div className="p-6">Produto não encontrado.</div></div>;

  const precoFinal = p.promo_ativa && p.preco_promocional ? p.preco_promocional : p.preco;

  return (
    <div className="min-h-screen bg-black text-white">
      <HeaderPremium />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <div className="aspect-square w-full rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden">
              {p.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.foto_url} alt={p.nome} className="h-full w-full object-cover" />
              ) : (
                <span className="text-white/60">Sem foto</span>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <div className="text-sm text-white/70">{p.marca || "Premium"}</div>
            <h1 className="mt-2 text-3xl font-semibold">{p.nome}</h1>

            <div className="mt-4 flex items-end gap-3">
              <div className="text-3xl font-bold">{brl(precoFinal)}</div>
              {p.promo_ativa && p.preco_promocional ? (
                <div className="text-white/50 line-through">{brl(p.preco)}</div>
              ) : null}
            </div>

            <div className="mt-2 text-white/70">
              Estoque: <span className="text-white">{p.quantidade}</span>
            </div>

            <p className="mt-4 text-white/75 whitespace-pre-line">{p.descricao || ""}</p>

            <button
              disabled={p.quantidade <= 0}
              onClick={() => {
                addItem({
                  produto_id: p.id,
                  nome: p.nome,
                  foto_url: p.foto_url,
                  preco_unit: precoFinal,
                  quantidade: 1,
                });
                openCart();
              }}
              className="mt-6 w-full rounded-2xl bg-white text-black py-3 font-semibold disabled:opacity-50"
            >
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
