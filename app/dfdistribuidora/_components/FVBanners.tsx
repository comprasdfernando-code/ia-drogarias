// app/dfdistribuidora/_components/FVBanners.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

/**
 * ✅ Versão genérica:
 * - tenta ler da tabela "df_banners"
 * - se não existir/der erro: mostra 0 banners sem quebrar a home
 *
 * Estrutura recomendada da tabela df_banners:
 * id uuid pk
 * ativo boolean default true
 * ordem int default 0
 * titulo text null
 * subtitulo text null
 * imagem text (url) not null
 * link text null
 */
type BannerRow = {
  id: string;
  ativo?: boolean | null;
  ordem?: number | null;
  titulo?: string | null;
  subtitulo?: string | null;
  imagem?: string | null;
  link?: string | null;
};

export default function FVBanners() {
  const [items, setItems] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("df_banners")
          .select("id,ativo,ordem,titulo,subtitulo,imagem,link")
          .eq("ativo", true)
          .order("ordem", { ascending: true })
          .limit(12);

        if (error) throw error;

        const arr = (data || []) as BannerRow[];
        setItems(arr.filter((x) => x.imagem));
      } catch (e) {
        // ✅ se a tabela não existir ou der erro, não quebra a home
        console.warn("DF banners indisponível:", e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-32 sm:h-40 rounded-3xl bg-white border shadow-sm overflow-hidden">
          <div className="h-full w-full bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.slice(0, 2).map((b) => {
          const Card = (
            <div className="relative h-32 sm:h-40 rounded-3xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition">
              <Image
                src={b.imagem || "/banners/banner-padrao.jpg"}
                alt={b.titulo || "Banner"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
                priority
              />
              {(b.titulo || b.subtitulo) && (
                <div className="absolute inset-0 bg-black/20" />
              )}
              {(b.titulo || b.subtitulo) && (
                <div className="absolute left-4 bottom-4 right-4 text-white">
                  {b.titulo ? <div className="font-extrabold text-lg leading-tight">{b.titulo}</div> : null}
                  {b.subtitulo ? <div className="text-sm opacity-95 mt-0.5">{b.subtitulo}</div> : null}
                </div>
              )}
            </div>
          );

          return b.link ? (
            <Link key={b.id} href={b.link} target={b.link.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              {Card}
            </Link>
          ) : (
            <div key={b.id}>{Card}</div>
          );
        })}
      </div>
    </div>
  );
}
