"use client";

import { CartProvider } from "./context/CartContext";


export default function Layout({ children }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-black text-white">
        {children}
      </div>
    </CartProvider>
  );
}
