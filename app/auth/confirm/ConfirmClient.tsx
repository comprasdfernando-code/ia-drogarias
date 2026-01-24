"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ConfirmClient() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const run = async () => {
      // fluxo novo (PKCE): ?code=...
      const code = sp.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace("/profissional/painel");
          return;
        }
      }

      // fluxo otp: ?token_hash=...&type=...
      const token_hash = sp.get("token_hash");
      const type = sp.get("type");
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });
        if (!error) {
          router.replace("/profissional/painel");
          return;
        }
      }

      router.replace("/profissional/painel");
    };

    run();
  }, [router, sp]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm text-center">
        <div className="text-lg font-bold text-slate-900">IA Drogarias</div>
        <div className="mt-2 text-sm text-slate-600">Confirmando seu cadastro…</div>
      </div>
    </main>
  );
}
