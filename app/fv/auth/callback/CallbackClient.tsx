"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function safeNext(next?: string | null) {
  const n = String(next || "").trim();
  if (!n) return "/fv/conta";
  // evita open redirect (não deixa mandar pra site externo)
  if (n.startsWith("http://") || n.startsWith("https://")) return "/fv/conta";
  return n.startsWith("/") ? n : `/${n}`;
}

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const nextUrl = useMemo(() => safeNext(sp.get("next")), [sp]);
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setStatus("working");
        setErr(null);

        // Se já tem sessão, só redireciona
        const s0 = await supabase.auth.getSession();
        if (s0?.data?.session) {
          if (!alive) return;
          setStatus("ok");
          router.replace(nextUrl);
          return;
        }

        // Troca o "code" por sessão (OAuth/magic link PKCE)
        // Para links que usam #access_token, o Supabase também consegue pegar com getSession após o redirect,
        // mas deixamos o exchangeCodeForSession para cobrir o caso de "code=".
        const url = typeof window !== "undefined" ? window.location.href : "";
        const hasCode = /[?&]code=/.test(url);

        if (hasCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) throw error;
        }

        // tenta pegar sessão de novo
        const s1 = await supabase.auth.getSession();
        if (!s1?.data?.session) {
          // se não veio sessão, ainda assim manda pra entrar
          if (!alive) return;
          setStatus("error");
          setErr("Não foi possível confirmar a sessão. Tente entrar novamente.");
          router.replace(`/fv/entrar?next=${encodeURIComponent(nextUrl)}`);
          return;
        }

        if (!alive) return;
        setStatus("ok");
        router.replace(nextUrl);
      } catch (e: any) {
        if (!alive) return;
        setStatus("error");
        setErr(String(e?.message || e));
        router.replace(`/fv/entrar?next=${encodeURIComponent(nextUrl)}`);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, nextUrl]);

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="rounded-2xl border bg-white p-4">
        <div className="text-lg font-extrabold">Autenticando…</div>
        <div className="mt-2 text-sm text-slate-600">
          Estamos confirmando seu acesso e te redirecionando.
        </div>

        {status === "error" && err ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 whitespace-pre-wrap">
            {err}
          </div>
        ) : null}

        <div className="mt-3 text-xs text-slate-500">Destino: {nextUrl}</div>
      </div>
    </div>
  );
}
