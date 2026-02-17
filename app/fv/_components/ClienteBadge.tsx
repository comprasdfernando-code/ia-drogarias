"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCustomer } from "./useCustomer";

function firstName(full?: string | null) {
  const s = (full || "").trim();
  if (!s) return "";
  return s.split(/\s+/)[0] || s;
}

export default function ClienteBadge() {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, user, profile, signOut } = useCustomer();
  const [busy, setBusy] = useState(false);

  const nome = useMemo(() => {
    const n = profile?.nome || user?.user_metadata?.name || user?.email || "";
    return firstName(n);
  }, [profile?.nome, user?.user_metadata?.name, user?.email]);

  async function onEntrar() {
    const next = encodeURIComponent(pathname || "/fv");
    router.push(`/fv/entrar?next=${next}`);
  }

  async function onSair() {
    setBusy(true);
    try {
      await signOut();
      // volta pra FV e recarrega state do app
      router.refresh?.();
      router.push("/fv");
    } finally {
      setBusy(false);
    }
  }

  // compactinho pro header
  return (
    <div className="flex items-center gap-2">
      {loading ? (
        <div className="hidden sm:flex items-center gap-2">
          <div className="h-9 w-28 rounded-full bg-white/15 animate-pulse" />
        </div>
      ) : user ? (
        <>
          <div className="hidden sm:block text-white font-extrabold text-sm whitespace-nowrap">
            Olá, {nome || "cliente"}
          </div>

          <button
            type="button"
            onClick={onSair}
            disabled={busy}
            className="rounded-full bg-white/10 hover:bg-white/15 text-white font-extrabold text-sm px-3 py-2 disabled:opacity-60"
            title="Sair"
          >
            {busy ? "Saindo…" : "Sair"}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onEntrar}
          className="rounded-full bg-white text-blue-900 font-extrabold text-sm px-3 py-2 hover:opacity-95"
          title="Entrar"
        >
          Entrar
        </button>
      )}
    </div>
  );
}
