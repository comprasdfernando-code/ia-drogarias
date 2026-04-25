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

export type EnderecoEntrega = {
  cep?: string | null;
  endereco: string;
  numero: string;
  bairro: string;
  cidade?: string | null;
  estado?: string | null;
  complemento?: string | null;
  referencia?: string | null;
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

  endereco: EnderecoEntrega | null;
  setEndereco: (endereco: EnderecoEntrega | null) => void;
  clearEndereco: () => void;
};

const LS_KEY = "FV_CART_V1";
const LS_ENDERECO_KEY = "FV_ENDERECO_ENTREGA_V1";

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [endereco, setEnderecoState] = useState<EnderecoEntrega | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }

      const rawEndereco = localStorage.getItem(LS_ENDERECO_KEY);
      if (rawEndereco) {
        const parsedEndereco = JSON.parse(rawEndereco);
        setEnderecoState(parsedEndereco);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    try {
      if (endereco) {
        localStorage.setItem(LS_ENDERECO_KEY, JSON.stringify(endereco));
      } else {
        localStorage.removeItem(LS_ENDERECO_KEY);
      }
    } catch {}
  }, [endereco]);

  function setEndereco(novoEndereco: EnderecoEntrega | null) {
    setEnderecoState(novoEndereco);
  }

  function clearEndereco() {
    setEnderecoState(null);
  }

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
    setItems((prev) =>
      prev.map((x) => (x.ean === ean ? { ...x, qtd: x.qtd + 1 } : x))
    );
  }

  function dec(ean: string) {
    setItems((prev) =>
      prev.map((x) =>
        x.ean === ean ? { ...x, qtd: Math.max(1, x.qtd - 1) } : x
      )
    );
  }

  function remove(ean: string) {
    setItems((prev) => prev.filter((x) => x.ean !== ean));
  }

  function clear() {
    setItems([]);
  }

  const subtotal = useMemo(
    () =>
      items.reduce(
        (acc, it) => acc + (Number(it.preco) || 0) * (Number(it.qtd) || 0),
        0
      ),
    [items]
  );

  const countItems = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.qtd) || 0), 0),
    [items]
  );

  const value: CartCtx = {
    items,
    addItem,
    inc,
    dec,
    remove,
    clear,
    subtotal,
    countItems,
    endereco,
    setEndereco,
    clearEndereco,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider />");
  return ctx;
}