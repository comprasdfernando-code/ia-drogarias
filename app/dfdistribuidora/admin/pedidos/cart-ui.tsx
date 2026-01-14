"use client";

import { createContext, useContext, useMemo, useState } from "react";

type CartUIState = {
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  setCartOpen: (v: boolean) => void;
};

const CartUIContext = createContext<CartUIState | null>(null);

export function CartUIProvider({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);

  const value = useMemo<CartUIState>(
    () => ({
      cartOpen,
      setCartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
    }),
    [cartOpen]
  );

  return <CartUIContext.Provider value={value}>{children}</CartUIContext.Provider>;
}

export function useCartUI() {
  const ctx = useContext(CartUIContext);
  if (!ctx) throw new Error("useCartUI must be used within <CartUIProvider />");
  return ctx;
}
