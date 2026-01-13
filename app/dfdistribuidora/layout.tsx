// app/dfdistribuidora/layout.tsx
import React from "react";
import { CartProvider } from "./_components/cart";
import { ToastProvider } from "./_components/toast";
import { CartUIProvider } from "./_components/cart-ui";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ToastProvider>
        <CartUIProvider>{children}</CartUIProvider>
      </ToastProvider>
    </CartProvider>
  );
}
