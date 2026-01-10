"use client";

import { CartProvider } from "./_components/cart";

export default function FVLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
