import "./globals.css";
import type { Metadata } from "next";
import Header from "../components/Header";

export const metadata: Metadata = {
  title: "IA Drogarias",
  description: "Saúde com Inteligência 💊",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-100 text-gray-900">
        {/* Header fixo em todas as páginas */}
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}