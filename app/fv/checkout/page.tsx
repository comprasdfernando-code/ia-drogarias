import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic"; // evita pre-render quebrar com searchParams

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-6">Carregando checkout…</div>}>
      <CheckoutClient />
    </Suspense>
  );
}
