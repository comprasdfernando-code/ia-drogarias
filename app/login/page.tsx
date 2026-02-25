"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const APP_PASSWORD = "021185"; // 🔴 senha simples (troque quando quiser)
const LS_KEY = "iadrogarias_simple_auth";

export default function LoginPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [err, setErr] = useState<string>("");

  const isAuthed = useMemo(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(LS_KEY) === "1";
  }, []);

  useEffect(() => {
    if (isAuthed) {
      router.replace("/planilhadigital/temp");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function entrar() {
    setErr("");
    if ((senha || "").trim() !== APP_PASSWORD) {
      setErr("Senha incorreta.");
      return;
    }
    localStorage.setItem(LS_KEY, "1");
    router.replace("/planilhadigital/temp");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") entrar();
  }

  return (
    <div className="min-h-screen bg-[#f3f5f7]">
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-xl bg-white p-6 shadow-sm border">
          <h1 className="text-xl font-semibold text-center">IA Drogarias</h1>
          <p className="text-sm text-center opacity-70 mt-1">
            Acesso rápido (senha simples)
          </p>

          <div className="mt-6">
            <label className="text-sm font-medium">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={onKeyDown}
              className="mt-1 w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Digite a senha"
              autoFocus
            />
            {err ? <div className="mt-2 text-sm text-red-600">{err}</div> : null}
          </div>

          <button
            onClick={entrar}
            className="mt-4 w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:opacity-95"
          >
            Entrar
          </button>

          <div className="mt-4 text-xs opacity-60 text-center">
            * Login local para operação/demonstração. Depois a gente liga login Supabase multi-loja.
          </div>
        </div>
      </div>
    </div>
  );
}