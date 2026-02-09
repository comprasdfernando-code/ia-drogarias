// app/autoeletrico/ninhocar/erp/vendas/page.tsx
import { Suspense } from "react";
import VendasClient from "./VendasClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Carregando vendas…</div>}>
      <VendasClient />
    </Suspense>
  );
}
