"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthConfirmPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    async function handleAuth() {
      const access_token = sp.get("access_token");
      const refresh_token = sp.get("refresh_token");

      if (access_token && refresh_token) {
        await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
      }

      router.replace("/profissional/painel");
    }

    handleAuth();
  }, [router, sp]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      Confirmando acesso...
    </div>
  );
}
