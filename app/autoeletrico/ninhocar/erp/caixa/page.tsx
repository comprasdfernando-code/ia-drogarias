import { Suspense } from "react";
import CaixaClient from "./CaixaClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Carregando caixa…</div>}>
      <CaixaClient />
    </Suspense>
  );
}
