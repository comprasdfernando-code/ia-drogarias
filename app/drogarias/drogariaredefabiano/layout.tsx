import { ReactNode } from "react";
import { CartProvider } from "./_components/cart";
import { ToastProvider } from "./_components/toast";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <CartProvider>{children}</CartProvider>
    </ToastProvider>
  );
}
