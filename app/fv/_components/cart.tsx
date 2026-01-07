"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  ean: string;
  nome: string;
  laboratorio?: string | null;
  apresentacao?: string | null;
  imagem?: string | null;
  preco: number; // preço final usado no carrinho
  qtd: number;
};

type CartCtx = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qtd">, qtd?: number) => void;
  setQty: (ean: string, qtd: number) => void;
  inc: (ean: string) => void;
  dec: (ean: string) => void;
  remove: (ean: string) => void;
  clear: () => void;
  countItems: number;
  subtotal: number;
};

const CartContext = createContext<CartCtx | null>(null);
const LS_KEY = "fv_cart_v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  function addItem(item: Omit<CartItem, "qtd">, qtd = 1) {
    const q = Math.max(1, Number(qtd || 1));
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

  function setQty(ean: string, qtd: number) {
    const q = Math.max(0, Number(qtd || 0));
    setItems((prev) => {
      if (q === 0) return prev.filter((x) => x.ean !== ean);
      return prev.map((x) => (x.ean === ean ? { ...x, qtd: q } : x));
    });
  }

  function inc(ean: string) {
    setItems((prev) => prev.map((x) => (x.ean === ean ? { ...x, qtd: x.qtd + 1 } : x)));
  }

  function dec(ean: string) {
    setItems((prev) =>
      prev
        .map((x) => (x.ean === ean ? { ...x, qtd: Math.max(0, x.qtd - 1) } : x))
        .filter((x) => x.qtd > 0)
    );
  }

  function remove(ean: string) {
    setItems((prev) => prev.filter((x) => x.ean !== ean));
  }

  function clear() {
    setItems([]);
  }

  const countItems = useMemo(() => items.reduce((a, b) => a + b.qtd, 0), [items]);
  const subtotal = useMemo(() => items.reduce((a, b) => a + b.preco * b.qtd, 0), [items]);

  const value: CartCtx = {
    items,
    addItem,
    setQty,
    inc,
    dec,
    remove,
    clear,
    countItems,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
