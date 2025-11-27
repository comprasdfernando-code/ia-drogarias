import "./globals.css";
import type { Metadata } from "next";
import RootClientLayout from "./root-client-layout";
import { CartProvider } from "./contexts/CartContext";

export const metadata: Metadata = {
  title: "IA Drogarias",
  description: "Saúde com Inteligência ❤️",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {/* ATENÇÃO: Agora tudo da aplicação tem acesso ao carrinho */}
        <CartProvider>
          <RootClientLayout>
            {children}
          </RootClientLayout>
        </CartProvider>
      </body>
    </html>
  );
}
