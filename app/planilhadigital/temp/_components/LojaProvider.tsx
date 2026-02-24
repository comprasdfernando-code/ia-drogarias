"use client";

import React, { createContext, useContext, useMemo } from "react";
import { LOJA_FIXED_ID, LOJA_FIXED_NOME, LOJA_FIXED_ROLE } from "./lojaFixed";

type LojaContextType = {
  lojaId: string;
  setLojaId: (id: string) => void;
  role: string;
  lojas: { id: string; nome: string; role: string }[];
  loading: boolean;
  reload: () => Promise<void>;
};

const LojaCtx = createContext<LojaContextType | null>(null);

export function LojaProvider({ children }: { children: React.ReactNode }) {
  // MODO FIXO: sempre Rede Fabiano
  const value = useMemo<LojaContextType>(
    () => ({
      lojaId: LOJA_FIXED_ID,
      setLojaId: () => {}, // travado
      role: LOJA_FIXED_ROLE,
      lojas: [{ id: LOJA_FIXED_ID, nome: LOJA_FIXED_NOME, role: LOJA_FIXED_ROLE }],
      loading: false,
      reload: async () => {},
    }),
    []
  );

  return <LojaCtx.Provider value={value}>{children}</LojaCtx.Provider>;
}

export function useLoja() {
  const ctx = useContext(LojaCtx);
  if (!ctx) throw new Error("useLoja deve ser usado dentro de LojaProvider");
  return ctx;
}