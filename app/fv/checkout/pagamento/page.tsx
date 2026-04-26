import { Suspense } from "react";
import CheckoutClient from "../CheckoutClient";

export default function PagamentoPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense
        fallback={
          <div className="p-6 text-sm text-slate-600">
            Carregando pagamento…
          </div>
        }
      >
        <CheckoutClient />
      </Suspense>
    </main>
  );
}