"use client";

import Link from "next/link";
import { useMemo } from "react";
import CartDrawer from "./CartDrawer";
import { useCart } from "./cart";
import { useCartUI } from "./cart-ui";
import { useCustomer } from "./useCustomer";

const TAXA_ENTREGA = 10;

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FVTopbar() {
  const { countItems, subtotal } = useCart();
  const { openCart } = useCartUI();
  const { user, signOut } = useCustomer();

  const totalTopo = useMemo(
    () => (countItems ? subtotal + TAXA_ENTREGA : 0),
    [subtotal, countItems]
  );

  const nomeCliente = user?.user_metadata?.nome || "Cliente";

  return (
    <>
      <header className="sticky top-0 z-[70] border-b border-white/10 bg-[#0D47A1] text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/fv" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
              <span className="text-2xl font-black text-[#E30613]">✚</span>
            </div>

            <div className="leading-tight">
              <div className="text-xl font-black tracking-tight">
                <span className="text-[#E30613]">ia</span>
                <span className="text-white">drogarias</span>
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                Farmácia Virtual
              </div>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <div className="hidden items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 md:flex">
                <span className="max-w-[170px] truncate text-sm font-bold">
                  Oie, {nomeCliente}
                </span>

                <Link
                  href="/fv/conta"
                  className="rounded-xl bg-white px-3 py-1.5 text-xs font-black text-[#0D47A1] transition hover:bg-white/90"
                >
                  Minha conta
                </Link>

                <button
                  onClick={signOut}
                  className="rounded-xl bg-[#E30613] px-3 py-1.5 text-xs font-black text-white transition hover:brightness-95"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-black transition hover:bg-white/20"
              >
                Entrar
              </Link>
            )}

            <button
              onClick={openCart}
              className="relative flex items-center gap-2 rounded-2xl bg-white px-4 py-2 font-black text-[#0D47A1] shadow-md transition hover:scale-[1.02]"
            >
              <span className="text-lg">🛒</span>
              <span className="hidden sm:inline">Carrinho</span>
              <span className="hidden md:inline">• {brl(totalTopo)}</span>

              {countItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#FFD400] text-xs font-black text-[#0D47A1] shadow">
                  {countItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {user && (
          <div className="border-t border-white/10 bg-[#083B8F] px-4 py-2 md:hidden">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
              <span className="truncate text-sm font-bold">
                Oie, {nomeCliente}
              </span>

              <div className="flex gap-2">
                <Link
                  href="/fv/conta"
                  className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-black"
                >
                  Conta
                </Link>

                <button
                  onClick={signOut}
                  className="rounded-xl bg-[#E30613] px-3 py-1.5 text-xs font-black"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <MobileCartBar onOpen={openCart} />

      <CartDrawer />
    </>
  );
}

function MobileCartBar({ onOpen }: { onOpen: () => void }) {
  const { countItems, subtotal } = useCart();

  const total = useMemo(
    () => (countItems ? subtotal + TAXA_ENTREGA : 0),
    [countItems, subtotal]
  );

  if (!countItems) return null;

  return (
    <button
      onClick={onOpen}
      className="fixed bottom-4 left-4 right-4 z-[75] flex items-center justify-between rounded-2xl bg-[#0D47A1] px-4 py-3 font-black text-white shadow-2xl sm:hidden"
    >
      <span>🛒 Ver carrinho ({countItems})</span>
      <span>{brl(total)}</span>
    </button>
  );
}