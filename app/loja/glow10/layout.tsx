import React from "react";
import { CartUIProvider } from "./_components/CartProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CartUIProvider>{children}</CartUIProvider>;
}
