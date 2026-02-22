"use client";

// app/clinicas/dradudarodrigues/_components/ClinicShell.tsx
import type { ReactNode } from "react";
import ClinicSidebar from "./ClinicSidebar";
import ClinicTopbar from "./ClinicTopbar";
import AuthGate from "./AuthGate";

export default function ClinicShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="flex">
          <ClinicSidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            <ClinicTopbar />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}