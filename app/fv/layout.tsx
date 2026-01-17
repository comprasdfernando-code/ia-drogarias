import { CartProvider } from "./_components/cart";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
