import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

export default function CallbackPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Suspense fallback={<div className="p-6 text-sm text-slate-600">Confirmando acesso…</div>}>
        <CallbackClient />
      </Suspense>
    </main>
  );
}
