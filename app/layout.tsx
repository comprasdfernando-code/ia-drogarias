import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IA Drogarias",
  description: "Marketplace de farmácias",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
        {/* Corrige zoom no celular */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>IA Drogarias</title>
      <body>{children}</body>
    </html>
  );
}