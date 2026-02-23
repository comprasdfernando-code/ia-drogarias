"use client";

// app/clinicas/dradudarodrigues/_components/ClinicShell.tsx
import type { ReactNode } from "react";
import AuthGate from "./AuthGate";
import ClinicSidebar from "./ClinicSidebar";
import ClinicTopbar from "./ClinicTopbar";
import { DUDA_THEME } from "../_lib/theme";

export default function ClinicShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className={`min-h-screen ${DUDA_THEME.text}`}>
        {/* fundo */}
        <div className={`fixed inset-0 -z-10 bg-gradient-to-b ${DUDA_THEME.bg}`} />
        {/* glow rosé/dourado */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute -top-52 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full blur-3xl bg-[#f7d9c4]/10" />
          <div className="absolute top-24 right-[-140px] h-[460px] w-[460px] rounded-full blur-3xl bg-[#f2caa2]/10" />
          <div className="absolute bottom-[-180px] left-[-140px] h-[520px] w-[520px] rounded-full blur-3xl bg-[#c78aa6]/08" />
        </div>

        <div className="flex min-h-screen">
          <ClinicSidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            <ClinicTopbar />
            <main className="flex-1 px-4 py-4 md:px-8 md:py-6">{children}</main>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}