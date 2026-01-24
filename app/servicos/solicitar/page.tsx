import { Suspense } from "react";
import SolicitarClient from "./SolicitarClient";

export default function SolicitarPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-600">Carregando…</div>}>
      <SolicitarClient />
    </Suspense>
  );
}
