"use client";

import { createContext, useContext, useState } from "react";

type Produto = {
  nome: string;
  preco: string;
};

type CartContextType = {
  carrinho: Produto[];
  adicionarProduto: (produto: Produto) => void;
  limparCarrinho: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [carrinho, setCarrinho] = useState<Produto[]>([]);

  const adicionarProduto = (produto: Produto) => {
    setCarrinho((prev) => [...prev, produto]);
  };

  const limparCarrinho = () => setCarrinho([]);

  return (
    <CartContext.Provider value={{ carrinho, adicionarProduto, limparCarrinho }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
}
