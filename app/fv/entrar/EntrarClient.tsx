"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";

export default function EntrarClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const nextUrl = useMemo(() => sp.get("next") || "/fv/conta", [sp]);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-extrabold">Entrar</h1>
      <p className="mt-2 text-sm text-slate-600">
        Faça login para acompanhar seus pedidos e não preencher seus dados toda vez.
      </p>

      {/* coloque aqui seu componente de login / supabase auth */}
      <button
        className="mt-6 w-full rounded-xl bg-black px-4 py-3 font-extrabold text-white"
        onClick={() => router.push(nextUrl)}
      >
        Continuar
      </button>
    </div>
  );
}
