// app/servicos/agenda/page.tsx
import { Suspense } from "react";
import AgendaClient from "./AgendaClient";

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-sm text-slate-600">Carregando agenda...</div>
    </div>
  );
}

export default function AgendaPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AgendaClient />
    </Suspense>
  );
}
