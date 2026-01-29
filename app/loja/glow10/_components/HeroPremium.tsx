"use client";

import Image from "next/image";
import Link from "next/link";

export default function HeroPremium() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <div className="relative overflow-hidden rounded-[28px] ring-1 ring-white/10 bg-white/5">
        {/* brilho premium */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative p-6 sm:p-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs ring-1 ring-white/10">
              ✨ Premium Makeup Store
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
              Glow 10 — maquiagem premium
              <span className="block text-white/70 text-lg sm:text-xl mt-2">
                Seu glow diário por 10. Produtos selecionados, acabamento impecável.
              </span>
            </h1>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="#produtos"
                className="rounded-2xl bg-white px-5 py-3 font-semibold text-black"
              >
                Ver produtos
              </a>
              <Link
                href="/loja/glow10/admin"
                className="rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/10 hover:bg-white/15"
              >
                Cadastrar produtos
              </Link>
            </div>

            <div className="mt-4 text-xs text-white/55">
              * Pagamento confirmado no Caixa (fluxo PDV).
            </div>
          </div>

          {/* logo grande no banner */}
          <div className="flex justify-center sm:justify-end">
            <div className="h-24 w-56 sm:h-28 sm:w-72 rounded-3xl bg-black/40 ring-1 ring-white/10 p-3 flex items-center justify-center">
              <Image
                src="/loja/glow10/glow10-logo.jpg"
                alt="Glow 10"
                width={520}
                height={240}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
