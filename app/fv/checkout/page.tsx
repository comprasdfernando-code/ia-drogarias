// app/fv/checkout/page.tsx
import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense
        fallback={
          <div className="p-6 text-sm text-slate-600">
            Carregando checkout…
          </div>
        }
      >
        <CheckoutClient />
      </Suspense>
    </main>
  );
}
