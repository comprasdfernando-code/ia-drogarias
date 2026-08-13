import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Drogarias Porto | Loja 2",
  description: "Drogarias Porto Loja 2 — site, PDV e caixa integrados ao FV Marketplace.",
};

export default function DrogariasPortoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
