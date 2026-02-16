// app/auth/confirm/page.tsx
import { Suspense } from "react";
import AuthConfirmClient from "./AuthConfirmClient";

export default function AuthConfirmPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="p-6 text-sm text-slate-600">Confirmando…</div>}>
        <AuthConfirmClient />
      </Suspense>
    </main>
  );
}
