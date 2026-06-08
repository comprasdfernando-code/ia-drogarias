"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const { data } = await supabase.auth.getSession();
      const has = !!data.session;

      if (!has && pathname !== "/saude/login") {
        router.replace("/saude/login");
        return;
      }
      if (mounted) setReady(true);
    }

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const has = !!session;
      if (!has && pathname !== "/saude/login") router.replace("/saude/login");
      if (has && pathname === "/saude/login") router.replace("/saude");
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (!ready) return <div className="p-6 text-sm text-slate-600">Carregando…</div>;
  return <>{children}</>;
}