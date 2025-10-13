"use client";

import dynamic from "next/dynamic";

// Importa o componente real da agenda de forma dinâmica (somente no client)
const AgendaPageClient = dynamic(() => import("./AgendaClient"), { ssr: false });

export default function AgendaPageWrapper() {
  return <AgendaPageClient />;
}
