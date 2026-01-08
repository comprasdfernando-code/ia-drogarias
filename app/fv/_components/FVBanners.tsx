"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  image: string; // /public...
  tag?: string; // "ATÉ 60% OFF"
};

const HERO_BANNERS: Banner[] = [
  {
    id: "hero-1",
    title: "Verão em Família",
    subtitle: "Protetores, repelentes e cuidados diários",
    href: "/fv?busca=protetor",
    image: "/fv/banners/verao.jpg",
    tag: "OFERTAS",
  },
  {
    id: "hero-2",
    title: "Genéricos e Similares",
    subtitle: "Preço bom pra comprar agora",
    href: "/fv?busca=generico",
    image: "/fv/banners/genericos.jpg",
    tag: "ECONOMIA",
  },
  {
    id: "hero-3",
    title: "Dor e Febre",
    subtitle: "Encontre analgésicos e antitérmicos",
    href: "/fv?busca=dor",
    image: "/fv/banners/dor.jpg",
    tag: "RÁPIDO",
  },
];

const MINI_CARDS: Banner[] = [
  {
    id: "mini-1",
    title: "Dermocosméticos",
    subtitle: "Cuide da pele",
    href: "/fv?busca=dermo",
    image: "/fv/banners/dermo.jpg",
  },
  {
    id: "mini-2",
    title: "Vitaminas",
    subtitle: "Energia & imunidade",
    href: "/fv?busca=vitamina",
    image: "/fv/banners/vitaminas.jpg",
  },
  {
    id: "mini-3",
    title: "Infantil",
    subtitle: "Mamãe & bebê",
    href: "/fv?busca=bebe",
    image: "/fv/banners/bebe.jpg",
  },
  {
    id: "mini-4",
    title: "Cuidados com o Sol",
    subtitle: "Protetores solares",
    href: "/fv?busca=protetor",
    image: "/fv/banners/sol.jpg",
  },
];

export default function FVBanners() {
  const [idx, setIdx] = useState(0);

  const hero = useMemo(() => HERO_BANNERS[idx], [idx]);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HERO_BANNERS.length), 5200);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 mt-5">
      {/* HERO */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-3xl border border-white/40 shadow-sm bg-gradient-to-br from-blue-900 to-blue-700">
            {/* imagem */}
            <div className="absolute inset-0 opacity-35">
              <Image
                src={hero.image}
                alt={hero.title}
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* brilho */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-2xl" />

            {/* conteúdo */}
            <div className="relative p-6 md:p-8 text-white">
              <div className="flex items-center gap-2">
                {hero.tag && (
                  <span className="text-[11px] font-extrabold bg-white/15 border border-white/20 px-3 py-1 rounded-full">
                    {hero.tag}
                  </span>
                )}
                <span className="text-[11px] text-white/80">
                  IA Drogarias • Farmácia Virtual
                </span>
              </div>

              <h2 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight">
                {hero.title}
              </h2>
              {hero.subtitle && (
                <p className="mt-2 text-white/85 max-w-xl">
                  {hero.subtitle}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {hero.href ? (
                  <Link
                    href={hero.href}
                    className="bg-green-500 hover:bg-green-600 text-blue-950 font-extrabold px-4 py-2 rounded-2xl shadow-sm"
                  >
                    Ver ofertas
                  </Link>
                ) : null}

                <Link
                  href="/fv"
                  className="bg-white/12 hover:bg-white/18 border border-white/20 text-white font-extrabold px-4 py-2 rounded-2xl"
                >
                  Continuar comprando
                </Link>
              </div>

              {/* dots */}
              <div className="mt-6 flex items-center gap-2">
                {HERO_BANNERS.map((b, i) => (
                  <button
                    key={b.id}
                    aria-label={`Banner ${i + 1}`}
                    onClick={() => setIdx(i)}
                    className={`h-2.5 rounded-full transition-all ${
                      i === idx ? "w-8 bg-white" : "w-2.5 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* card lateral estilo “benefícios” */}
        <div className="rounded-3xl border bg-white shadow-sm p-5 md:p-6">
          <h3 className="text-lg font-extrabold text-blue-950">
            Compra rápida
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Adicione no carrinho e finalize no WhatsApp em poucos cliques.
          </p>

          <div className="mt-4 space-y-3">
            <Benefit icon="⚡" title="Rápido" desc="Carrinho modal para Melhor agilidade" />
            <Benefit icon="✅" title="Confirmação" desc="Checamos disponibilidade e retornamos" />
            <Benefit icon="🚚" title="Entrega" desc="Taxa fixa e prazo até 24h" />
          </div>

          <div className="mt-5 p-4 rounded-2xl bg-gray-50 border">
            <div className="text-xs text-gray-500">Dica</div>
            <div className="text-sm font-semibold text-gray-800">
              Pesquise pelo nome ou EAN pra achar rapidinho.
            </div>
          </div>
        </div>
      </div>

      {/* MINI CARDS */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {MINI_CARDS.map((c) => (
          <Link
            key={c.id}
            href={c.href || "/fv"}
            className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
          >
            <div className="absolute inset-0 opacity-20">
              <Image src={c.image} alt={c.title} fill className="object-cover" />
            </div>
            <div className="relative p-4">
              <div className="text-sm font-extrabold text-blue-950">
                {c.title}
              </div>
              {c.subtitle && (
                <div className="text-xs text-gray-600 mt-0.5">
                  {c.subtitle}
                </div>
              )}
              <div className="mt-3 text-xs font-extrabold text-blue-700 group-hover:underline">
                Ver →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Benefit({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-2xl bg-blue-50 border flex items-center justify-center">
        <span className="text-lg">{icon}</span>
      </div>
      <div>
        <div className="font-extrabold text-gray-900">{title}</div>
        <div className="text-sm text-gray-600">{desc}</div>
      </div>
    </div>
  );
}
