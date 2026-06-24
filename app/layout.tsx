import "./globals.css";
import type { Metadata } from "next";
import RootClientLayout from "./root-client-layout";
import { CartProvider } from "./contexts/CartContext";
import "leaflet/dist/leaflet.css";


export const metadata = {
  title: {
    default: 'Tem Aqui no Bairro',
    template: '%s | Tem Aqui no Bairro',
  },
  description: 'Comércios, serviços, promoções e eventos do seu bairro.',
}

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
