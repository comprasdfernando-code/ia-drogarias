"use client";

import dynamic from "next/dynamic";

// Carrega o client-only (evita erro de useSearchParams / window)
const AgendaClient = dynamic(
  () => import("./AgendaClient"),
  { ssr: false }
);

export default function AgendaPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <AgendaClient />
    </main>
  );
}
