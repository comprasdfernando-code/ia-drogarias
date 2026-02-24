"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const APP_PASSWORD = "1234"; // <-- troque aqui
const LS_KEY = "iadrogarias_simple_auth";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/planilhadigital/temp";

  const [senha, setSenha] = useState("");
  const [err, setErr] = useState("");

  function entrar() {
    setErr("");
    if (senha.trim() !== APP_PASSWORD) {
      setErr("Senha incorreta");
      return;
    }
    localStorage.setItem(LS_KEY, "1");
    router.replace(next);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f5f7] p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 border shadow-sm">
        <h1 className="text-xl font-semibold text-center">IA Drogarias</h1>
        <p className="text-sm text-center opacity-70 mt-1">Acesso por senha</p>

        <div className="mt-6">
          <label className="text-sm font-medium">Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mt-1 w-full rounded-lg border p-3"
            placeholder="Digite a senha"
          />
          {err ? <div className="mt-2 text-sm text-red-600">{err}</div> : null}
        </div>

        <button onClick={entrar} className="mt-4 w-full rounded-lg bg-green-600 py-3 font-semibold text-white">
          Entrar
        </button>
      </div>
    </div>
  );
}