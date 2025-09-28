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
      <head>
        {/* Corrige zoom no celular */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}