"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type CartItem = {
  ean: string;
  nome: string;
  preco: number;
  qtd: number;
  imagem?: string | null;
  laboratorio?: string | null;
  apresentacao?: string | null;
};

type CartCtx = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qtd">, qtd?: number) => void;
  inc: (ean: string) => void;
  dec: (ean: string) => void;
  remove: (ean: string) => void;
  clear: () => void;
  subtotal: number;
  countItems: number;
};

const LS_KEY = "FV_CART_V1";

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // ✅ começa VAZIO no server/client (hidrata igual)
  const [items, setItems] = useState<CartItem[]>([]);

  // ✅ carrega do localStorage só DEPOIS que montou no client
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

  // ✅ salva sempre que mudar (somente no client)
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
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

  function inc(ean: string) {
    setItems((prev) => prev.map((x) => (x.ean === ean ? { ...x, qtd: x.qtd + 1 } : x)));
  }

  function dec(ean: string) {
    setItems((prev) =>
      prev
        .map((x) => (x.ean === ean ? { ...x, qtd: Math.max(1, x.qtd - 1) } : x))
        .filter((x) => x.qtd > 0)
    );
  }

  function remove(ean: string) {
    setItems((prev) => prev.filter((x) => x.ean !== ean));
  }

  function clear() {
    setItems([]);
  }

  const subtotal = useMemo(() => items.reduce((acc, it) => acc + (Number(it.preco) || 0) * (Number(it.qtd) || 0), 0), [items]);
  const countItems = useMemo(() => items.reduce((acc, it) => acc + (Number(it.qtd) || 0), 0), [items]);

  const value: CartCtx = {
    items,
    addItem,
    inc,
    dec,
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
