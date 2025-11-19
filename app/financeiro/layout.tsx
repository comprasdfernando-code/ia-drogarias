// app/financeiro/layout.tsx
import type { ReactNode } from "react";
import SidebarFinanceiro from "../financeiro/sidebar";
import TopbarFinanceiro from "../financeiro/topbar";

export default function FinanceiroLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      <SidebarFinanceiro />
      <div className="flex flex-1 flex-col">
        <TopbarFinanceiro />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
