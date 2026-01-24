"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ConfirmClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [msg, setMsg] = useState("Confirmando...");
  const [error, setError] = useState<string | null>(null);

  const qp = useMemo(() => {
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type"); // signup | magiclink | recovery | invite
    const next = searchParams.get("next") || "/profissional/painel";
    return { code, token_hash, type, next };
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setError(null);

        // 1) PKCE (mais comum em apps Next atuais)
        if (qp.code) {
          setMsg("Confirmando sessão...");
          const { error } = await supabase.auth.exchangeCodeForSession(qp.code);
          if (error) throw error;

          if (!cancelled) {
            setMsg("Acesso confirmado! Redirecionando...");
            router.replace(qp.next);
          }
          return;
        }

        // 2) token_hash + type (outro formato do Supabase)
        if (qp.token_hash && qp.type) {
          setMsg("Validando link...");
          const { error } = await supabase.auth.verifyOtp({
            token_hash: qp.token_hash,
            type: qp.type as any,
          });
          if (error) throw error;

          if (!cancelled) {
            setMsg("Conta confirmada! Redirecionando...");
            router.replace(qp.next);
          }
          return;
        }

        throw new Error("Link inválido: parâmetros ausentes.");
      } catch (e: any) {
        console.error("confirm error:", e);

        // Alguns casos do Supabase dão throttle de poucos segundos.
        // Aqui a gente só mostra um erro amigável e permite voltar.
        const message =
          e?.message ||
          "Não foi possível confirmar. Abra o link mais recente do email e tente novamente.";

        if (!cancelled) {
          setError(message);
          setMsg("Falha na confirmação.");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [qp.code, qp.token_hash, qp.type, qp.next, router]);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16">
        <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-lg font-bold text-slate-900">IA Drogarias</div>
          <div className="mt-1 text-sm text-slate-600">{msg}</div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                >
                  Tentar novamente
                </button>
                <button
                  onClick={() => router.replace("/profissional/entrar")}
                  className="rounded-xl border px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  Ir para login
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-xs text-slate-500">
              Você pode fechar essa aba após redirecionar.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
