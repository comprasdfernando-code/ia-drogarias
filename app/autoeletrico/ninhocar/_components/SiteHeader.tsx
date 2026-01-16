// components/SiteHeader.tsx
"use client";

import Link from "next/link";

function buildWhatsAppLink(numberE164: string, msg: string) {
  const clean = numberE164.replace(/\D/g, "");
  const text = encodeURIComponent(msg);
  return `https://wa.me/${clean}?text=${text}`;
}

export default function SiteHeader() {
  const WHATS = "5511948343725";
  const wa = buildWhatsAppLink(
    WHATS,
    "Olá! Vim pelo site da Ninho Car. Quero um orçamento 🙂"
  );

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          {/* Se tiver logo em /public/ninhocar/logo.png, ele aparece.
              Se não tiver, mostra o selo. */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-zinc-950 font-black">
            NC
          </div>
          <div className="leading-tight">
            <div className="text-base font-extrabold tracking-wide">
              NINHO <span className="text-yellow-400">CAR</span>
            </div>
            <div className="text-xs text-zinc-400">
              Auto Elétrica & Conveniência
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/loja"
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold hover:bg-zinc-800"
          >
            Loja
          </Link>

          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-yellow-400 px-3 py-2 text-sm font-extrabold text-zinc-950 hover:brightness-110"
          >
            WhatsApp
          </a>

          <Link
            href="/financeiro"
            className="hidden rounded-xl border border-zinc-800 bg-transparent px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900 sm:inline-flex"
          >
            Financeiro
          </Link>
        </nav>
      </div>
    </header>
  );
}
