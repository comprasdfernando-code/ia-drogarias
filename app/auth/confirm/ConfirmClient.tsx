"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ConfirmClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState("Processando…");

  useEffect(() => {
    (async () => {
      try {
        const next = sp.get("next") || "/";

        // Fluxo novo (PKCE): vem ?code=...
        const code = sp.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setMsg("Link inválido/expirado. Peça um novo.");
            return;
          }
          router.replace(next);
          return;
        }

        // Fluxo antigo: vem ?token_hash=...&type=signup|recovery
        const token_hash = sp.get("token_hash");
        const type = sp.get("type") as "signup" | "recovery" | "email_change" | null;

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash, type });
          if (error) {
            setMsg("Link inválido/expirado. Peça um novo.");
            return;
          }
          router.replace(next);
          return;
        }

        setMsg("Faltou parâmetro no link. Reenvie o e-mail e tente novamente.");
      } catch (e) {
        setMsg("Erro ao confirmar. Tente novamente.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-lg font-bold text-slate-900">IA Drogarias</h1>
        <p className="mt-2 text-sm text-slate-600">{msg}</p>
      </div>
    </main>
  );
}
