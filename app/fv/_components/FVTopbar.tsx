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
  const { user } = useCustomer();

  const totalTopo = useMemo(
    () => (countItems ? subtotal + TAXA_ENTREGA : 0),
    [subtotal, countItems]
  );

  return (
    <>
      <div className="sticky top-0 z-[70] bg-gradient-to-b from-blue-800 to-blue-700 text-white border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          
          {/* LOGO */}
          <Link href="/fv" className="font-extrabold tracking-tight">
            IA Drogarias <span className="text-white/80">• FV</span>
          </Link>

          {/* DIREITA */}
          <div className="ml-auto flex items-center gap-2">

            {/* 👤 CONTA */}
            {user ? (
              <Link
                href="/fv/minha-conta"
                className="bg-white/15 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-2 text-sm font-bold"
              >
                👤 Minha conta
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-white/15 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-2 text-sm font-bold"
              >
                Entrar
              </Link>
            )}

            {/* 🛒 CARRINHO */}
            <button
              onClick={openCart}
              className="relative bg-white/15 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-2 font-extrabold text-sm flex items-center gap-2"
            >
              <span>🛒</span>
              <span className="hidden sm:inline">Carrinho</span>

              <span className="text-white/90 hidden md:inline">
                • {brl(totalTopo)}
              </span>

              {countItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-400 text-blue-950 text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center shadow">
                  {countItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE */}
      <MobileCartBar onOpen={openCart} />

      {/* DRAWER */}
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
      className="fixed z-[75] bottom-4 left-4 right-4 sm:hidden bg-blue-700 text-white rounded-2xl shadow-2xl px-4 py-3 font-extrabold flex items-center justify-between"
    >
      <span>Ver carrinho ({countItems})</span>
      <span>{brl(total)}</span>
    </button>
  );
}