"use client";

import { CartProvider } from "./_components/cart";
import FVTopbar from "./_components/FVTopbar";

export default function FVLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <FVTopbar />
      {children}
    </CartProvider>
  );
}
