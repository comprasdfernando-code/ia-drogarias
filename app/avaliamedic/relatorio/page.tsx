import { Suspense } from "react";
import RelatorioClient from "./RelatorioClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="text-xl font-semibold">Carregando relatório...</h1>
        </main>
      }
    >
      <RelatorioClient />
    </Suspense>
  );
}
