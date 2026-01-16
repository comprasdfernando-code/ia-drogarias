import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Ninho Car — Auto Elétrica & Conveniência",
  description: "Auto elétrica, som automotivo, acessórios e conveniência.",
};

export default function NinhoCarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-100">
      {children}
    </section>
  );
}
