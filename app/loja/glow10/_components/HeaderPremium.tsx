"use client";

import Link from "next/link";
import Image from "next/image";

export default function HeaderPremium() {
  return (
    <header className="sticky top-0 z-40 bg-black/70 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
        <Link href="/loja/glow10" className="flex items-center gap-3">
          <div className="h-12 w-28 sm:w-36 rounded-2xl bg-white/5 ring-1 ring-white/10 overflow-hidden flex items-center justify-center">
            <Image
              src="/loja/glow10/glow10-logo.jpg"
              alt="Glow 10"
              width={260}
              height={120}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <div className="leading-tight hidden sm:block">
            <div className="text-lg font-semibold">Glow 10</div>
            <div className="text-xs text-white/60">Seu glow diário por 10</div>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/loja/glow10/admin"
            className="rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/10 hover:bg-white/15"
          >
            Admin
          </Link>
          <Link
            href="/loja/glow10/painel/vendas"
            className="rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/10 hover:bg-white/15"
          >
            Painel
          </Link>
          <Link
            href="/loja/glow10/caixa"
            className="rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/10 hover:bg-white/15"
          >
            Caixa
          </Link>
        </div>
      </div>
    </header>
  );
}
