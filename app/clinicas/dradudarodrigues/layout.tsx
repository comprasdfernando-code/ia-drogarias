// app/clinicas/dradudarodrigues/layout.tsx
import type { ReactNode } from "react";
import ClinicShell from "./_components/ClinicShell";

export default function DraDudaLayout({ children }: { children: ReactNode }) {
  return <ClinicShell>{children}</ClinicShell>;
}