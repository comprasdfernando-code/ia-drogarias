import { Suspense } from "react";
import AgendaClient from "./AgendaClient";

export default function AgendaPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-600">Carregando…</div>}>
      <AgendaClient />
    </Suspense>
  );
}
