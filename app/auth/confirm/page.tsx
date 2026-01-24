// app/auth/confirm/page.tsx
import { Suspense } from "react";
import ConfirmClient from "./ConfirmClient";

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-sm text-slate-600">Confirmando seu acesso...</div>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ConfirmClient />
    </Suspense>
  );
}
