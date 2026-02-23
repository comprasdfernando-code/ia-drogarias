"use client";

// app/clinicas/dradudarodrigues/_components/ClinicShell.tsx
import type { ReactNode } from "react";
import ClinicSidebar from "./ClinicSidebar";
import ClinicTopbar from "./ClinicTopbar";
import AuthGate from "./AuthGate";

export default function ClinicShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-screen text-slate-100">
        {/* Fundo rosé/dourado (igual vibe Anne Dayane) */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#07040b] via-[#0b0612] to-[#06030a]" />

        {/* Glows */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-44 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full blur-3xl bg-[#f7d9c4]/10" />
          <div className="absolute top-28 right-[-140px] h-[440px] w-[440px] rounded-full blur-3xl bg-[#f2caa2]/08" />
          <div className="absolute bottom-[-220px] left-[-160px] h-[520px] w-[520px] rounded-full blur-3xl bg-[#c084fc]/06" />
        </div>

        <div className="flex">
          <ClinicSidebar />

          <div className="flex min-h-screen flex-1 flex-col">
            <ClinicTopbar />

            {/* Conteúdo com “glass” */}
            <main className="flex-1 p-4 md:p-6">
              <div className="mx-auto w-full max-w-6xl">
                <div className="rounded-3xl border border-[#2a1c2f]/70 bg-[#06030a]/35 backdrop-blur-md shadow-[0_0_0_1px_rgba(184,138,90,0.08)]">
                  <div className="p-4 md:p-6">{children}</div>
                </div>
              </div>

              {/* rodapé suave */}
              <div className="mx-auto mt-6 max-w-6xl text-xs text-slate-500">
                Tema: rosé + dourado • Dra Duda
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}