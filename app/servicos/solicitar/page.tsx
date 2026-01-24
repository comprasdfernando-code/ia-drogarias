"use client";

import dynamic from "next/dynamic";

const SolicitarClient = dynamic(() => import("./SolicitarClient"), { ssr: false });

export default function SolicitarPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SolicitarClient />
    </main>
  );
}
