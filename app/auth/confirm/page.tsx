import { Suspense } from "react";
import AuthConfirmClient from "./AuthConfirmClient";

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-600">Confirmando…</div>}>
      <AuthConfirmClient />
    </Suspense>
  );
}
