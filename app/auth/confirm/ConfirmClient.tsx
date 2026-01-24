"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ConfirmClient() {
  const params = useSearchParams();
  const router = useRouter();

  const ran = useRef(false);
  const [msg, setMsg] = useState("Confirmando seu acesso…");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        // Supabase pode mandar `code` (PKCE) ou token_hash/type (email link)
        const code = params.get("code");
        const token_hash = params.get("token_hash");
        const type = params.get("type") as
          | "signup"
          | "recovery"
          | "invite"
          | "magiclink"
          | "email_change"
          | null;

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setMsg("✅ Confirmado! Redirecionando…");
          router.replace("/profissional/painel");
          return;
        }

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash, type });
          if (error) throw error;
          setMsg("✅ Confirmado! Redirecionando…");
          router.replace("/profissional/painel");
          return;
        }

        setMsg("Link inválido ou incompleto.");
      } catch (e: any) {
        // Esse erro “only request after 4 seconds” costuma acontecer quando tenta confirmar 2x (reload/duplo verify)
        setMsg(e?.message || "Erro ao confirmar. Tente abrir o link novamente.");
      }
    })();
  }, [params, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="rounded-2xl border bg-white p-6 shadow-sm max-w-md w-full">
        <div className="text-lg font-bold text-slate-900">IA Drogarias</div>
        <div className="mt-2 text-sm text-slate-600">{msg}</div>
        <div className="mt-4 text-xs text-slate-500">
          Se você clicou duas vezes no link, espere alguns segundos e tente novamente.
        </div>
      </div>
    </main>
  );
}
