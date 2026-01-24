"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthConfirmClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const [msg, setMsg] = useState("Confirmando seu e-mail…");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        // Supabase manda "code" (PKCE) ou, em alguns casos, tokens.
        const code = sp.get("code");
        const error = sp.get("error");
        const errorDesc = sp.get("error_description");

        if (error) {
          setMsg(`Erro: ${errorDesc || error}`);
          return;
        }

        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) {
            setMsg(`Falha ao confirmar: ${exErr.message}`);
            return;
          }

          setMsg("E-mail confirmado ✅ Redirecionando…");
          router.replace("/profissional/painel");
          return;
        }

        // fallback: se não veio code, tenta só ir pro login/painel
        setMsg("Link inválido ou incompleto. Indo para o painel…");
        router.replace("/profissional/painel");
      } catch (e: any) {
        if (!alive) return;
        setMsg(`Erro inesperado: ${e?.message || "desconhecido"}`);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [sp, router]);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-2xl border p-5">
          <div className="text-lg font-semibold text-slate-900">IA Drogarias</div>
          <div className="mt-2 text-sm text-slate-600">{msg}</div>
        </div>
      </div>
    </main>
  );
}
