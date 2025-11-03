import "./globals.css";
import type { Metadata } from "next";
import RootClientLayout from "./root-client-layout"; // ✅ usa o wrapper

export const metadata: Metadata = {
  title: "IA Drogarias",
  description: "Saúde com Inteligência 💊",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {/* ✅ O Header/rodapé passam a ser controlados aqui dentro */}
        <RootClientLayout>{children}</RootClientLayout>
      </body>
    </html>
  );
}