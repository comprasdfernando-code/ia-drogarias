// app/clinicas/dradudarodrigues/lp/layout.tsx
import type { ReactNode } from "react";

export const metadata = {
  title: "Mentoria VIP — Dra. Duda Rodrigues",
  description:
    "Mentoria VIP presencial em São Paulo: Anatomia, técnicas e intercorrências. Participação AO VIVO direto de Miami com Dra. Patrícia Oyole.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-white">
      {/* Fundo premium (não mexe no resto do sistema) */}
      <div className="fixed inset-0 -z-20 bg-[#07030b]" />

      {/* Glow rosé/dourado */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-52 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full blur-3xl bg-[#f7d9c4]/20" />
        <div className="absolute top-24 right-[-180px] h-[540px] w-[540px] rounded-full blur-3xl bg-[#f2caa2]/18" />
        <div className="absolute bottom-[-220px] left-[-220px] h-[640px] w-[640px] rounded-full blur-3xl bg-[#ff9fcf]/18" />
      </div>

      {/* Vinheta pra dar contraste e “sumir” o cinza */}
      <div className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_70%,rgba(0,0,0,0.85)_100%)]" />

      {children}
    </div>
  );
}