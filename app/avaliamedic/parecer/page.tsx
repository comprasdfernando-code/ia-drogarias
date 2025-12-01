import { Suspense } from "react";
import ParecerClient from "./ParecerClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="text-xl font-semibold">
            Carregando parecer...
          </h1>
        </main>
      }
    >
      <ParecerClient />
    </Suspense>
  );
}
