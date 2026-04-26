import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { CartProvider } from "./_components/cart";
import { CartUIProvider } from "./_components/cart-ui";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "IA Drogarias • Farmácia Virtual",
  description:
    "Medicamentos, genéricos, higiene, infantil e produtos de farmácia online.",
};

export default function FVLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={poppins.className}>
      <CartProvider>
        <CartUIProvider>{children}</CartUIProvider>
      </CartProvider>
    </div>
  );
}