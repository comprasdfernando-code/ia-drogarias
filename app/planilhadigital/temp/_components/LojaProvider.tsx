"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type LojaItem = {
  loja_id: string;
  role: string;
  lojas?: { nome?: string } | null;
};

type LojaContextType = {
  lojaId: string;
  setLojaId: (id: string) => void;
  role: string;
  lojas: { id: string; nome: string; role: string }[];
  loading: boolean;
  reload: () => Promise<void>;
};

const LojaCtx = createContext<LojaContextType | null>(null);

const LS_KEY = "IA_TEMP_LOJA_ATIVA";

export function LojaProvider({ children }: { children: React.ReactNode }) {
  const [lojaId, setLojaIdState] = useState<string>("");
  const [role, setRole] = useState<string>("operador");
  const [lojas, setLojas] = useState<{ id: string; nome: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const setLojaId = (id: string) => {
    setLojaIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(LS_KEY, id);
  };

  async function reload() {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setLojas([]);
      setLojaIdState("");
      setRole("operador");
      setLoading(false);
      return;
    }

    // Busca lojas do usuário + nome da loja
    const { data, error } = await supabase
      .from("usuario_lojas")
      .select("loja_id, role, lojas:lojas(nome)")
      .order("loja_id");

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const rows = (data || []) as any as LojaItem[];
    const normalized = rows.map((r) => ({
      id: r.loja_id,
      nome: r.lojas?.nome || `Loja ${r.loja_id.slice(0, 6)}`,
      role: r.role || "operador",
    }));

    setLojas(normalized);

    // escolhe loja ativa
    let desired = "";
    if (typeof window !== "undefined") desired = localStorage.getItem(LS_KEY) || "";

    const picked =
      normalized.find((l) => l.id === desired) ||
      normalized[0] ||
      null;

    if (picked) {
      setLojaIdState(picked.id);
      setRole(picked.role);
    } else {
      setLojaIdState("");
      setRole("operador");
    }

    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // quando muda lojaId, atualiza role correspondente
  useEffect(() => {
    if (!lojaId) return;
    const r = lojas.find((l) => l.id === lojaId)?.role;
    if (r) setRole(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId]);

  const value = useMemo(
    () => ({ lojaId, setLojaId, role, lojas, loading, reload }),
    [lojaId, role, lojas, loading]
  );

  return <LojaCtx.Provider value={value}>{children}</LojaCtx.Provider>;
}

export function useLoja() {
  const ctx = useContext(LojaCtx);
  if (!ctx) throw new Error("useLoja deve ser usado dentro de LojaProvider");
  return ctx;
}