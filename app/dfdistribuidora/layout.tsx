"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type CartUIContextType = {
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartUIContext = createContext<CartUIContextType | null>(null);

export function CartUIProvider({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);

  const value = useMemo(
    () => ({
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
    }),
    [cartOpen]
  );

  return <CartUIContext.Provider value={value}>{children}</CartUIContext.Provider>;
}

export function useCartUI() {
  const ctx = useContext(CartUIContext);
  if (!ctx) throw new Error("useCartUI deve ser usado dentro de <CartUIProvider/>");
  return ctx;
}
