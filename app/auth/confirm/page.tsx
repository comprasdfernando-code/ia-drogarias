import { Suspense } from "react";
import ConfirmClient from "./ConfirmClient";

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-600">Confirmando…</div>}>
      <ConfirmClient />
    </Suspense>
  );
}
