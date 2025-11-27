export const metadata = {
  title: "Sorveteria Oggi - Catálogo",
  description: "Catálogo oficial para pedidos via WhatsApp",
};

import "../globals.css";
import { CartProvider } from "../contexts/CartContext";

export default function SorveteriaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ background: "#fde7f7", minHeight: "100vh" }}>
        <CartProvider>
          <header
            style={{
              width: "100%",
              background: "#ff48c4",
              padding: "15px 0",
              textAlign: "center",
              color: "white",
              fontSize: "22px",
              fontWeight: "bold",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            🍦 Sorveteria Oggi — Catálogo Oficial
          </header>

          {children}
        </CartProvider>
      </body>
    </html>
  );
}
