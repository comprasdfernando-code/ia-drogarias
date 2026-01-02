import { Suspense } from "react";
import RelatorioClient from "./RelatorioClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Carregando relatório...</div>}>
      <RelatorioClient />
    </Suspense>
  );
}
