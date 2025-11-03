"use client";

import "./globals.css";
import type { Metadata } from "next";
import Header from "../components/Header";
import { usePathname } from "next/navigation";
// Se o Footer não existir, essa linha pode ser removida sem problema
// import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "IA Drogarias",
  description: "Saúde com Inteligência 💊",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Verifica se estamos dentro do projeto Gigante
  const isGigante = pathname?.startsWith("/gigante");

  return (
    <html lang="pt-BR">
      <body>
        {/* Mostra o Header e o Footer apenas fora do Gigante */}
        {!isGigante && <Header />}

        {children}

        {/* Se tiver Footer, mantém essa linha, senão pode remover */}
        {/* {!isGigante && <Footer />} */}
      </body>
    </html>
  );
}