"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type CustomerProfile = {
  user_id: string;
  nome: string | null;
  email: string | null;
  cpf: string | null;
  phone: string | null;
  updated_at?: string | null;
};

export function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

export function useCustomer() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const u = data?.user ?? null;
      setUser(u);

      if (!u) {
        setProfile(null);
        return;
      }

      const { data: prof, error } = await supabase
        .from("customer_profiles")
        .select("user_id,nome,email,cpf,phone,updated_at")
        .eq("user_id", u.id)
        .maybeSingle();

      if (error) {
        // Se a tabela não existir / RLS bloquear etc, não derruba o site
        setProfile(null);
        return;
      }

      setProfile((prof as any) || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      sub?.subscription?.unsubscribe?.();
    };
  }, [load]);

  const updateProfile = useCallback(
    async (patch: Partial<CustomerProfile>) => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) throw new Error("Sem usuário logado.");

      const payload: CustomerProfile = {
        user_id: u.id,
        nome: patch.nome ?? profile?.nome ?? (u.user_metadata?.name ?? null),
        email:
          (patch.email ?? profile?.email ?? u.email ?? null)?.toString().toLowerCase() ??
          null,
        cpf: patch.cpf ? onlyDigits(String(patch.cpf)).slice(0, 11) : (profile?.cpf ?? null),
        phone: patch.phone ? onlyDigits(String(patch.phone)) : (profile?.phone ?? null),
        updated_at: new Date().toISOString(),
      };

      const { data: saved, error } = await supabase
        .from("customer_profiles")
        .upsert(payload, { onConflict: "user_id" })
        .select("user_id,nome,email,cpf,phone,updated_at")
        .maybeSingle();

      if (error) throw error;

      // atualiza estado local
      if (saved) setProfile(saved as any);
      else setProfile(payload);

      return saved || payload;
    },
    [profile]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return { loading, user, profile, reload: load, updateProfile, signOut };
}
