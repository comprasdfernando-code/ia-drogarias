import { Suspense } from "react";
import ProcessandoClient from "./ProcessandoClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-semibold text-emerald-700">
            Carregando avaliação...
          </h1>
          <p className="text-gray-600 mt-2">
            Preparando a análise da prescrição.
          </p>
        </main>
      }
    >
      <ProcessandoClient />
    </Suspense>
  );
}
