import { Suspense } from "react";
import RelatoriosClient from "./RelatoriosClient";

export default function RelatoriosPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Suspense fallback={<div className="p-6 text-sm text-slate-300">Carregando…</div>}>
        <RelatoriosClient />
      </Suspense>
    </main>
  );
}
