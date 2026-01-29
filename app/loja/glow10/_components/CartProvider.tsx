"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type CartItem = {
  produto_id: string;
  nome: string;
  foto_url?: string | null;
  preco_unit: number;
  quantidade: number;
};

type CartCtx = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (i: CartItem) => void;
  inc: (produto_id: string) => void;
  dec: (produto_id: string) => void;
  remove: (produto_id: string) => void;
  clear: () => void;
  subtotal: number;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartUIProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.preco_unit) || 0) * (Number(it.quantidade) || 0), 0),
    [items]
  );

  const api: CartCtx = {
    items,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),

    addItem: (i) => {
      setItems((prev) => {
        const idx = prev.findIndex((p) => p.produto_id === i.produto_id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], quantidade: copy[idx].quantidade + i.quantidade };
          return copy;
        }
        return [...prev, i];
      });
    },

    inc: (id) => setItems((p) => p.map((it) => (it.produto_id === id ? { ...it, quantidade: it.quantidade + 1 } : it))),
    dec: (id) =>
      setItems((p) =>
        p.map((it) => (it.produto_id === id ? { ...it, quantidade: Math.max(1, it.quantidade - 1) } : it))
      ),
    remove: (id) => setItems((p) => p.filter((it) => it.produto_id !== id)),
    clear: () => setItems([]),
    subtotal,
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCartUI() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCartUI precisa estar dentro do CartUIProvider");
  return v;
}
