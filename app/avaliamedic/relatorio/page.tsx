import { Suspense } from "react";
import RelatorioClient from "./RelatorioClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6">Carregando relatório...</p>}>
      <RelatorioClient />
    </Suspense>
  );
}
