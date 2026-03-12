"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;

      if (!uid && pathname !== "/admin-saude/login") {
        router.replace("/admin-saude/login");
        return;
      }

      if (!uid) {
        if (mounted) setReady(true);
        return;
      }

      const { data: prof } = await supabase
        .from("saude_profiles")
        .select("role, drogaria_id")
        .eq("user_id", uid)
        .maybeSingle();

      if (prof?.role !== "drogaria_admin") {
        router.replace("/saude");
        return;
      }

      if (mounted) setReady(true);
    }

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const has = !!session;
      if (!has && pathname !== "/admin-saude/login") {
        router.replace("/admin-saude/login");
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (!ready) {
    return <div className="p-6 text-sm text-slate-600">Carregando…</div>;
  }

  return <>{children}</>;
}