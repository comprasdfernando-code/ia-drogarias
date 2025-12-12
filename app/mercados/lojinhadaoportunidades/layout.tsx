"use client";

import { CartProvider } from "./context/CartContext";
import "./styles.css"; // se quiser usar CSS global para neon

export default function Layout({ children }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-black text-white">
        {children}
      </div>
    </CartProvider>
  );
}
