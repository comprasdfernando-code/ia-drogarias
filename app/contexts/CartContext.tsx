"use client";

import { createContext, useContext, useState } from "react";

type Produto = {
  id: string;
  nome: string;
  preco: number;     // agora número
  sabor?: string;
  image_url?: string;
};

type CarrinhoItem = Produto & {
  quantidade: number;
};

type CartContextType = {
  carrinho: CarrinhoItem[];
  adicionarProduto: (produto: Produto) => void;
  removerProduto: (id: string) => void;
  alterarQuantidade: (id: string, quantidade: number) => void;
  limparCarrinho: () => void;
  total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);

  // ADICIONAR ITEM
  const adicionarProduto = (produto: Produto) => {
    setCarrinho((prev) => {
      const existente = prev.find((p) => p.id === produto.id);

      if (existente) {
        // Se já existe, só aumenta a quantidade
        return prev.map((p) =>
          p.id === produto.id
            ? { ...p, quantidade: p.quantidade + 1 }
            : p
        );
      } else {
        // Se não existe, adiciona novo
        return [...prev, { ...produto, quantidade: 1 }];
      }
    });
  };

  // REMOVER ITEM COMPLETAMENTE
  const removerProduto = (id: string) => {
    setCarrinho((prev) => prev.filter((p) => p.id !== id));
  };

  // ALTERAR QUANTIDADE DE UM ITEM
  const alterarQuantidade = (id: string, quantidade: number) => {
    if (quantidade <= 0) return removerProduto(id);

    setCarrinho((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, quantidade } : p
      )
    );
  };

  // LIMPAR CARRINHO
  const limparCarrinho = () => setCarrinho([]);

  // CALCULO TOTAL
  const total = carrinho.reduce(
    (soma, p) => soma + p.preco * p.quantidade,
    0
  );

  return (
    <CartContext.Provider
      value={{
        carrinho,
        adicionarProduto,
        removerProduto,
        alterarQuantidade,
        limparCarrinho,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context)
    throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
}
