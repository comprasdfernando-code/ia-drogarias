// app/dfdistribuidora/_components/cart.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type CartItem = {
  ean: string;
  nome: string;
  laboratorio?: string | null;
  apresentacao?: string | null;
  imagem?: string | null;
  preco: number;
  qtd: number;
};

type CartCtx = {
  items: CartItem[];
  subtotal: number;
  countItems: number;
  addItem: (item: Omit<CartItem, "qtd">, qtd?: number) => void;
  inc: (ean: string) => void;
  dec: (ean: string) => void;
  remove: (ean: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({
  children,
  storageKey = "cart_default",
}: {
  children: React.ReactNode;
  storageKey?: string;
}) {
  const [items, setItems] = useState<CartItem[]>([]);

  // load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // save
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}
  }, [items, storageKey]);

  const subtotal = useMemo(() => items.reduce((acc, it) => acc + it.preco * it.qtd, 0), [items]);
  const countItems = useMemo(() => items.reduce((acc, it) => acc + it.qtd, 0), [items]);

  function addItem(item: Omit<CartItem, "qtd">, qtd = 1) {
    const q = Math.max(1, Math.floor(Number(qtd || 1)));
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.ean === item.ean);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qtd: copy[idx].qtd + q };
        return copy;
      }
      return [...prev, { ...item, qtd: q }];
    });
  }

  function inc(ean: string) {
    setItems((prev) => prev.map((it) => (it.ean === ean ? { ...it, qtd: it.qtd + 1 } : it)));
  }

  function dec(ean: string) {
    setItems((prev) =>
      prev
        .map((it) => (it.ean === ean ? { ...it, qtd: Math.max(1, it.qtd - 1) } : it))
        .filter((it) => it.qtd >= 1)
    );
  }

  function remove(ean: string) {
    setItems((prev) => prev.filter((it) => it.ean !== ean));
  }

  function clear() {
    setItems([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }

  const value: CartCtx = {
    items,
    subtotal,
    countItems,
    addItem,
    inc,
    dec,
    remove,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
