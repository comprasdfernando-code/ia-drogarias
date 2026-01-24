"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthConfirmPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState("Confirmando seu cadastro...");

  useEffect(() => {
    const run = async () => {
      // Alguns fluxos usam ?code=, outros retornam tokens no hash
      const code = sp.get("code");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          setMsg("Cadastro confirmado ✅ Redirecionando...");
          router.replace("/profissional/painel");
          return;
        }

        // Se não veio code, só manda pro painel mesmo (muitas vezes já cria a session)
        setMsg("Cadastro confirmado ✅ Redirecionando...");
        router.replace("/profissional/painel");
      } catch (e: any) {
        console.error(e);
        setMsg("Não foi possível confirmar. Peça um novo link de confirmação.");
      }
    };

    run();
  }, [sp, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm text-center">
        <div className="text-lg font-bold text-slate-900">IA Drogarias</div>
        <div className="mt-2 text-sm text-slate-600">{msg}</div>
      </div>
    </main>
  );
}
