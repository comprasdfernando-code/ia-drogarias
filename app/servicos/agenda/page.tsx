"use client";

import dynamic from "next/dynamic";

const AgendaClient = dynamic(() => import("./AgendaClient"), { ssr: false });

export default function AgendaPage() {
  return <AgendaClient />;
}
