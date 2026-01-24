import { Suspense } from "react";
import ConfirmClient from "./ConfirmClient";

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Confirmando cadastro...</div>}>
      <ConfirmClient />
    </Suspense>
  );
}
