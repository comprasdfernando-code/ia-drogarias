"use client";

import Link from "next/link";
import MedicaoForm from "../_components/MedicaoForm";

export default function RegistrarPage() {
  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Registrar medição</h1>
        <Link className="rounded-xl border px-3 py-2 text-sm" href="/saude">Voltar</Link>
      </div>
      <MedicaoForm />
    </div>
  );
}