import { Suspense } from "react";
import ProdutosClient from "./ProdutosClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Carregando produtos…</div>}>
      <ProdutosClient />
    </Suspense>
  );
}
