"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function safePath(p: string) {
  if (!p) return "/fv/conta";
  try {
    if (p.startsWith("http://") || p.startsWith("https://")) {
      const u = new URL(p);
      return u.pathname + (u.search || "");
    }
  } catch {}
  if (!p.startsWith("/")) return `/${p}`;
  return p;
}

export default function FVAuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const nextUrl = useMemo(() => safePath(sp.get("next") || "/fv/conta"), [sp]);
  const [msg, setMsg] = useState("Confirmando acesso…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // ✅ cobre tanto callback com "code" (PKCE) quanto tokens no hash
        const code = sp.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // fallback para fluxos que voltam com hash/token
          // (dependendo da config do projeto)
          // @ts-ignore
          const { error } = await supabase.auth.getSessionFromUrl?.({ storeSession: true });
          if (error) throw error;
        }

        // garante que existe sessão
        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
          setMsg("Não foi possível confirmar a sessão. Tente novamente.");
          return;
        }

        if (!cancelled) router.replace(nextUrl);
      } catch (e: any) {
        if (!cancelled) {
          setMsg(`Erro ao confirmar: ${String(e?.message || e)}`);
          // manda de volta pro entrar (mantém next)
          setTimeout(() => {
            try {
              router.replace(`/fv/entrar?next=${encodeURIComponent(nextUrl)}`);
            } catch {}
          }, 900);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md p-6">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-semibold">Acesso</div>
          <div className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{msg}</div>
        </div>
      </div>
    </main>
  );
}
