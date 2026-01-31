// app/fv/checkout/page.tsx
import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Carregando checkout…</div>}>
      <CheckoutClient />
    </Suspense>
  );
}
