import "./globals.css";
import type { Metadata } from "next";
import RootClientLayout from "./root-client-layout";


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
      <body>
        <RootClientLayout>{children}</RootClientLayout>
      </body>
    </html>
  );
}
