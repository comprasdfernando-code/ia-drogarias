"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Banner = {
  id: string;
  tag?: string;
  titulo: string;
  subtitulo?: string;
  cta1?: { label: string; href: string };
  cta2?: { label: string; href: string };
  imagem: string;
};

export default function FVBanners({ showSideInfo = true }: { showSideInfo?: boolean }) {
  const banners = useMemo<Banner[]>(
    () => [
      {
        id: "verao",
        tag: "OFERTAS",
        titulo: "Verão em Família",
        subtitulo: "Protetores, repelentes e cuidados diários",
        cta1: { label: "Ver ofertas", href: "/fv/categoria/Cuidados%20com%20o%20Sol" },
        cta2: { label: "Continuar comprando", href: "/fv" },
        imagem: "/fv/banners/verao.jpg", // ajuste pro seu caminho real
      },
    ],
    []
  );

  const [idx, setIdx] = useState(0);
  const b = banners[idx];

  return (
    <section className="max-w-6xl mx-auto px-4">
      <div className={`grid gap-6 ${showSideInfo ? "lg:grid-cols-[1fr_380px]" : "grid-cols-1"}`}>
        {/* Banner */}
        <div className="bg-white border rounded-3xl shadow-sm overflow-hidden">
          <div className="relative h-[220px] sm:h-[260px] md:h-[300px]">
            <Image src={b.imagem} alt={b.titulo} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              {b.tag ? (
                <span className="inline-flex w-fit mb-2 text-[11px] font-extrabold bg-white/20 text-white px-3 py-1 rounded-full">
                  {b.tag}
                </span>
              ) : null}

              <div className="text-white text-3xl md:text-4xl font-extrabold leading-tight">{b.titulo}</div>
              {b.subtitulo ? <div className="text-white/90 mt-1 text-sm md:text-base">{b.subtitulo}</div> : null}

              <div className="mt-4 flex gap-3 flex-wrap">
                {b.cta1 ? (
                  <Link
                    href={b.cta1.href}
                    className="bg-green-500 hover:bg-green-600 text-white font-extrabold px-5 py-3 rounded-2xl"
                  >
                    {b.cta1.label}
                  </Link>
                ) : null}

                {b.cta2 ? (
                  <Link
                    href={b.cta2.href}
                    className="bg-white/15 hover:bg-white/20 text-white font-extrabold px-5 py-3 rounded-2xl border border-white/20"
                  >
                    {b.cta2.label}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          {/* Bolinhas / navegação simples (se tiver mais banners) */}
          {banners.length > 1 ? (
            <div className="p-4 flex items-center gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-2.5 rounded-full transition ${i === idx ? "w-10 bg-blue-700" : "w-2.5 bg-gray-300"}`}
                  aria-label={`Banner ${i + 1}`}
                />
              ))}
            </div>
          ) : (
            <div className="p-4" />
          )}
        </div>

        {/* ✅ Card lateral (DESLIGÁVEL) */}
        {showSideInfo ? (
          <aside className="bg-white border rounded-3xl shadow-sm p-6">
            <h3 className="text-xl font-extrabold">Compra rápida</h3>
            <p className="text-gray-600 mt-1">
              Adicione no carrinho e finalize no WhatsApp em poucos cliques.
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gray-100 flex items-center justify-center">⚡</div>
                <div>
                  <div className="font-extrabold">Rápido</div>
                  <div className="text-sm text-gray-600">Carrinho modal para melhor agilidade</div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gray-100 flex items-center justify-center">✅</div>
                <div>
                  <div className="font-extrabold">Confirmação</div>
                  <div className="text-sm text-gray-600">Checamos disponibilidade e retornamos</div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gray-100 flex items-center justify-center">🚚</div>
                <div>
                  <div className="font-extrabold">Entrega</div>
                  <div className="text-sm text-gray-600">Taxa fixa e prazo até 24h</div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border p-4 bg-gray-50">
                <div className="text-xs uppercase tracking-wide text-gray-500 font-bold">Dica</div>
                <div className="font-extrabold">Pesquise pelo nome ou EAN pra achar rapidinho.</div>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
