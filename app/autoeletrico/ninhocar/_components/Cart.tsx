"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type CartItem = {
  produto_id: string;
  nome: string;
  ean: string | null;
  preco: number;
  qtd: number;
  imagem: string;
  categoria: string | null;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qtd">, qtd?: number) => void;
  inc: (produto_id: string) => void;
  dec: (produto_id: string) => void;
  remove: (produto_id: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function add(item: Omit<CartItem, "qtd">, qtd = 1) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.produto_id === item.produto_id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qtd: next[i].qtd + qtd };
        return next;
      }
      return [...prev, { ...item, qtd }];
    });
  }

  function inc(produto_id: string) {
    setItems((prev) => prev.map((x) => (x.produto_id === produto_id ? { ...x, qtd: x.qtd + 1 } : x)));
  }

  function dec(produto_id: string) {
    setItems((prev) =>
      prev
        .map((x) => (x.produto_id === produto_id ? { ...x, qtd: x.qtd - 1 } : x))
        .filter((x) => x.qtd > 0)
    );
  }

  function remove(produto_id: string) {
    setItems((prev) => prev.filter((x) => x.produto_id !== produto_id));
  }

  function clear() {
    setItems([]);
  }

  const subtotal = useMemo(() => items.reduce((acc, it) => acc + it.preco * it.qtd, 0), [items]);
  const count = useMemo(() => items.reduce((acc, it) => acc + it.qtd, 0), [items]);

  const value = useMemo(
    () => ({ items, count, subtotal, add, inc, dec, remove, clear }),
    [items, count, subtotal]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
