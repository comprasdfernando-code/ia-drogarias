"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type CartItem = {
  produto_id: string;
  nome: string;
  preco: number;
  qtd: number;
  imagem_url?: string | null;
};

type CartContextType = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qtd">, qtd?: number) => void;
  remove: (produto_id: string) => void;
  inc: (produto_id: string) => void;
  dec: (produto_id: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function add(item: Omit<CartItem, "qtd">, qtd = 1) {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.produto_id === item.produto_id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qtd: next[idx].qtd + qtd };
        return next;
      }
      return [...prev, { ...item, qtd }];
    });
  }

  function remove(produto_id: string) {
    setItems((prev) => prev.filter((p) => p.produto_id !== produto_id));
  }

  function inc(produto_id: string) {
    setItems((prev) =>
      prev.map((p) => (p.produto_id === produto_id ? { ...p, qtd: p.qtd + 1 } : p))
    );
  }

  function dec(produto_id: string) {
    setItems((prev) =>
      prev
        .map((p) => (p.produto_id === produto_id ? { ...p, qtd: p.qtd - 1 } : p))
        .filter((p) => p.qtd > 0)
    );
  }

  function clear() {
    setItems([]);
  }

  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + Number(it.preco) * Number(it.qtd), 0),
    [items]
  );

  const count = useMemo(() => items.reduce((acc, it) => acc + it.qtd, 0), [items]);

  const value = useMemo(
    () => ({ items, add, remove, inc, dec, clear, subtotal, count }),
    [items, subtotal, count]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
