"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLoja } from "./LojaProvider";

export default function LojaSelectTop() {
  const { lojaId, setLojaId, lojas, role, loading } = useLoja();

  const [authInfo, setAuthInfo] = useState<{ id?: string; email?: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setAuthInfo({
        id: data?.user?.id,
        email: data?.user?.email ?? undefined,
      });
    })();
  }, []);

  return (
    <div className="mb-4 rounded border p-3">
      <div className="text-xs opacity-70">
        Supabase user: <b>{authInfo?.id || "NÃO LOGADO"}</b>
        {authInfo?.email ? <> • {authInfo.email}</> : null}
      </div>

      {/* (mantém o resto do seu componente abaixo) */}
      <div className="mt-2">
        {loading ? (
          <div className="text-sm opacity-70">Carregando lojas…</div>
        ) : !lojas.length ? (
          <div className="text-sm">Nenhuma loja vinculada ao usuário em <b>usuario_lojas</b>.</div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-sm">
              Loja ativa: <b>{lojas.find((l) => l.id === lojaId)?.nome || lojaId}</b>{" "}
              <span className="opacity-70">• Perfil: {role}</span>
            </div>

            {lojas.length > 1 ? (
              <select
                className="rounded border p-2 text-sm"
                value={lojaId}
                onChange={(e) => setLojaId(e.target.value)}
              >
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome} ({l.role})
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}