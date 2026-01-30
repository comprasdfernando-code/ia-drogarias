// app/dayfestas/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Day Festass | Toque Especial em Festas",
  description:
    "Mini festas, papelaria personalizada e decoração com carinho em cada detalhe.",
};

export default function DayFestasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
