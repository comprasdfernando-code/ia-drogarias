// components/FeaturedProducts.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { brl } from "@/lib/brl";

type Produto = {
  id: string;
  nome: string | null;
  slug: string | null;
  preco: number | null;
  preco_promocional: number | null;
  em_promocao: boolean | null;
  imagens: string[] | null;
  destaque_home: boolean | null;
  ativo: boolean | null;
};

function getImagem(p: Produto) {
  const img = p.imagens?.[0];
  return img && img.trim().length > 0 ? img : "/placeholder-produto.png";
}

export default function FeaturedProducts() {
  const [items, setItems] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("produtos")
        .select(
          "id,nome,slug,preco,preco_promocional,em_promocao,imagens,destaque_home,ativo"
        )
        .eq("ativo", true)
        .order("destaque_home", { ascending: false })
        .limit(8);

      if (!mounted) return;

      if (error) {
        console.error("Erro ao carregar produtos:", error.message);
        setItems([]);
      } else {
        // Prioriza destaque_home=true
        const destacados = (data || []).sort((a: any, b: any) =>
          (b.destaque_home ? 1 : 0) - (a.destaque_home ? 1 : 0)
        );
        setItems(destacados as Produto[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-14">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-wide">
            Destaques da <span className="text-yellow-400">Loja</span>
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Itens de conveniência e acessórios que giram rápido.
          </p>
        </div>

        <Link
          href="/loja"
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
        >
          Ver tudo
        </Link>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-sm text-zinc-300">
            Ainda sem destaques cadastrados. Assim que você marcar
            <b> destaque_home</b> nos produtos, eles aparecem aqui.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => {
              const preço =
                p.em_promocao && p.preco_promocional
                  ? p.preco_promocional
                  : p.preco;

              const href = p.slug ? `/loja/produto/${p.slug}` : "/loja";

              return (
                <Link
                  key={p.id}
                  href={href}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 hover:bg-zinc-900"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                    <Image
                      src={getImagem(p)}
                      alt={p.nome || "Produto"}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>

                  <div className="mt-3">
                    <div className="line-clamp-2 text-sm font-bold">
                      {p.nome || "Produto"}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="text-sm font-extrabold text-yellow-300">
                        {brl(preço)}
                      </div>

                      {p.em_promocao && p.preco ? (
                        <div className="text-xs text-zinc-400 line-through">
                          {brl(p.preco)}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 rounded-xl bg-yellow-400 px-3 py-2 text-center text-xs font-extrabold text-zinc-950">
                      Ver detalhes
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
