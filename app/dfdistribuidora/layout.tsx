// app/dfdistribuidora/layout.tsx
"use client";

import React from "react";
import { CartProvider } from "./_components/cart";
import { ToastProvider } from "./_components/toast";
import { CartUIProvider } from "./_components/cart-ui";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider storageKey="cart_df_distribuidora">
      <ToastProvider>
        <CartUIProvider>{children}</CartUIProvider>
      </ToastProvider>
    </CartProvider>
  );
}
