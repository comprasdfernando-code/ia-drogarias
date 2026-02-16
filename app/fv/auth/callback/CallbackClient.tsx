"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function safeNext(nextUrl: string) {
  if (!nextUrl) return "/fv/conta";
  if (!nextUrl.startsWith("/")) return "/fv/conta";
  if (nextUrl.startsWith("//")) return "/fv/conta";
  return nextUrl;
}

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const nextUrl = useMemo(() => safeNext(sp.get("next") || "/fv/conta"), [sp]);
  const [msg, setMsg] = useState("Confirmando…");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr(null);

        // ✅ 1) se for fluxo com hash (#access_token=...)
        if (typeof window !== "undefined" && window.location.hash?.includes("access_token=")) {
          // @ts-ignore
          const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (error) throw error;
        } else {
          // ✅ 2) se for fluxo com code (?code=...)
          const code = sp.get("code");
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
          }
        }

        // ✅ garante que tem sessão
        const { data } = await supabase.auth.getUser();
        if (!data?.user) throw new Error("Sessão não encontrada. Tente abrir o link novamente.");

        if (!alive) return;
        setMsg("Acesso confirmado! Redirecionando…");

        // limpa a URL (remove code/hash)
        try {
          const clean = new URL(window.location.href);
          clean.searchParams.delete("code");
          clean.hash = "";
          window.history.replaceState({}, "", clean.toString());
        } catch {}

        router.replace(nextUrl);
      } catch (e: any) {
        if (!alive) return;
        setErr(String(e?.message || e));
        setMsg("Não consegui confirmar o acesso.");
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border bg-white p-5">
        <div className="text-lg font-extrabold">Confirmação</div>
        <div className="mt-2 text-sm text-slate-600">{msg}</div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-wrap">
            {err}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => router.replace(nextUrl)}
          className="mt-4 w-full rounded-xl bg-black px-4 py-3 font-extrabold text-white"
        >
          Ir para minha conta
        </button>
      </div>
    </div>
  );
}
