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
  addItem: (item: Omit<CartItem, "qtd">, qtd?: number) => void;
  inc: (ean: string) => void;
  dec: (ean: string) => void;
  setQty: (ean: string, qtd: number) => void;
  remove: (ean: string) => void;
  clear: () => void;

  subtotal: number;
  countItems: number;
};

const LS_KEY = "drf_cart_v1";

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      // ignore
    }
  }, []);

  // save
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  function addItem(item: Omit<CartItem, "qtd">, qtd: number = 1) {
    const q = Math.max(1, Math.floor(Number(qtd || 1)));
    setItems((prev) => {
      const ex = prev.find((x) => x.ean === item.ean);
      if (ex) return prev.map((x) => (x.ean === item.ean ? { ...x, qtd: x.qtd + q } : x));
      return [...prev, { ...item, qtd: q }];
    });
  }

  function inc(ean: string) {
    setItems((prev) => prev.map((x) => (x.ean === ean ? { ...x, qtd: x.qtd + 1 } : x)));
  }

  function dec(ean: string) {
    setItems((prev) =>
      prev
        .map((x) => (x.ean === ean ? { ...x, qtd: Math.max(1, x.qtd - 1) } : x))
        .filter(Boolean)
    );
  }

  function setQty(ean: string, qtd: number) {
    const q = Math.max(1, Math.floor(Number(qtd || 1)));
    setItems((prev) => prev.map((x) => (x.ean === ean ? { ...x, qtd: q } : x)));
  }

  function remove(ean: string) {
    setItems((prev) => prev.filter((x) => x.ean !== ean));
  }

  function clear() {
    setItems([]);
  }

  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + Number(it.preco || 0) * Number(it.qtd || 0), 0);
  }, [items]);

  const countItems = useMemo(() => {
    return items.reduce((acc, it) => acc + Number(it.qtd || 0), 0);
  }, [items]);

  const value: CartCtx = {
    items,
    addItem,
    inc,
    dec,
    setQty,
    remove,
    clear,
    subtotal,
    countItems,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider />");
  return ctx;
}
