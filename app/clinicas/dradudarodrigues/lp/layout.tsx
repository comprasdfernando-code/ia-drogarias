// app/clinicas/dradudarodrigues/lp/layout.tsx
import type { ReactNode } from "react";

export const metadata = {
  title: "Mentoria VIP — Dra. Duda Rodrigues",
  description:
    "Mentoria VIP presencial em São Paulo: Anatomia, técnicas e intercorrências. Participação AO VIVO direto de Miami com Dra. Patrícia Oyole.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-slate-100">
      {/* Fundo rosé + dourado (não mexe no resto do sistema) */}
      <div className="fixed inset-0 -z-10 bg-[#06030a]" />
      <div className="fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl bg-[#f7d9c4]/10" />
        <div className="absolute top-28 right-[-140px] h-[460px] w-[460px] rounded-full blur-3xl bg-[#f2caa2]/10" />
        <div className="absolute bottom-[-160px] left-[-160px] h-[520px] w-[520px] rounded-full blur-3xl bg-[#ff9fcf]/10" />
      </div>

      {children}
    </div>
  );
}