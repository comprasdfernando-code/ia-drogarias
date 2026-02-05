// app/fisiocaresapopemba/receita/page.tsx
import { Suspense } from "react";
import ReceitaClient from "./ReceitaClient";

export default function ReceitaPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Suspense fallback={<div className="p-6 text-sm text-slate-600">Carregando…</div>}>
        <ReceitaClient />
      </Suspense>
    </main>
  );
}
