// app/dfdistribuidora/_components/cart.tsx
"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  ean: string;
  nome: string;
  laboratorio?: string | null;
  apresentacao?: string | null;
  imagem?: string | null;
  preco: number; // preço unitário
  qtd: number;
};

type CartCtx = {
  items: CartItem[];
  countItems: number;
  subtotal: number;

  addItem: (item: Omit<CartItem, "qtd">, qtd?: number) => void;
  inc: (ean: string) => void;
  dec: (ean: string) => void;
  remove: (ean: string) => void;
  clear: () => void;
};

const KEY = "df_cart_v1";
const Ctx = createContext<CartCtx | null>(null);

function safeJsonParse<T>(v: string | null, fallback: T): T {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // carregar do localStorage
  useEffect(() => {
    const data = safeJsonParse<CartItem[]>(typeof window !== "undefined" ? localStorage.getItem(KEY) : null, []);
    setItems(Array.isArray(data) ? data : []);
  }, []);

  // persistir
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "qtd">, qtd = 1) => {
    const q = Math.max(1, Number(qtd || 1));
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.ean === item.ean);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qtd: copy[idx].qtd + q, preco: Number(item.preco || copy[idx].preco) };
        return copy;
      }
      return [{ ...item, qtd: q }, ...prev];
    });
  }, []);

  const inc = useCallback((ean: string) => {
    setItems((prev) => prev.map((x) => (x.ean === ean ? { ...x, qtd: x.qtd + 1 } : x)));
  }, []);

  const dec = useCallback((ean: string) => {
    setItems((prev) =>
      prev
        .map((x) => (x.ean === ean ? { ...x, qtd: Math.max(1, x.qtd - 1) } : x))
        .filter((x) => x.qtd > 0)
    );
  }, []);

  const remove = useCallback((ean: string) => {
    setItems((prev) => prev.filter((x) => x.ean !== ean));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = useMemo(() => items.reduce((acc, it) => acc + Number(it.preco || 0) * Number(it.qtd || 0), 0), [items]);
  const countItems = useMemo(() => items.reduce((acc, it) => acc + Number(it.qtd || 0), 0), [items]);

  const value = useMemo<CartCtx>(
    () => ({ items, countItems, subtotal, addItem, inc, dec, remove, clear }),
    [items, countItems, subtotal, addItem, inc, dec, remove, clear]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // não quebrar se esquecer do provider
    return {
      items: [],
      countItems: 0,
      subtotal: 0,
      addItem: () => {},
      inc: () => {},
      dec: () => {},
      remove: () => {},
      clear: () => {},
    } as CartCtx;
  }
  return ctx;
}
