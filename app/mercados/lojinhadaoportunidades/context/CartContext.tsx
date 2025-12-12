"use client";

import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  function addToCart(product) {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        return prev.map(i =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function updateQty(id, qty) {
    setCart(prev =>
      prev.map(i => (i.id === id ? { ...i, qty } : i))
    );
  }

  function removeItem(id) {
    setCart(prev => prev.filter(i => i.id !== id));
  }

  return (
    <CartContext.Provider
      value={{ cart, addToCart, updateQty, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
