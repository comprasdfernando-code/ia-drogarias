import { Suspense } from "react";
import CentralBalcaoClient from "./CentralBalcaoClient";

export default function CentralBalcaoPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Suspense fallback={<div className="p-6 text-sm text-slate-600">Carregando…</div>}>
        <CentralBalcaoClient />
      </Suspense>
    </main>
  );
}
