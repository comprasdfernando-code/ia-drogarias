import { Suspense } from "react";
import BalcaoClient from "./BalcaoClient";

export default function BalcaoPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Suspense fallback={<div className="p-6 text-sm text-slate-600">Carregando…</div>}>
        <BalcaoClient />
      </Suspense>
    </main>
  );
}
