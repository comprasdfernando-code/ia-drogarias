import { Suspense } from "react";
import EntrarClient from "./EntrarClient";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Suspense fallback={<div className="p-6 text-sm text-slate-600">Carregando…</div>}>
        <EntrarClient />
      </Suspense>
    </main>
  );
}
