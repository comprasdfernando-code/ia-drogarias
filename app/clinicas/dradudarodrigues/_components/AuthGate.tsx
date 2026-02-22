"use client";

// app/clinicas/dradudarodrigues/_components/AuthGate.tsx
import { useEffect, useState, type ReactNode } from "react";

const LS_KEY = "draduda_admin_ok";
const SENHA_ADMIN = "021185"; // 🔴 troque depois

export default function AuthGate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);
  const [senha, setSenha] = useState("");

  useEffect(() => {
    const v = localStorage.getItem(LS_KEY);
    setOk(v === "1");
  }, []);

  function entrar() {
    if (senha === SENHA_ADMIN) {
      localStorage.setItem(LS_KEY, "1");
      setOk(true);
    } else {
      alert("Senha incorreta.");
    }
  }

  function sair() {
    localStorage.removeItem(LS_KEY);
    setOk(false);
    setSenha("");
  }

  if (ok === null) {
    return <div className="p-6 text-slate-300">Carregando…</div>;
  }

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow">
          <div className="text-xl font-semibold">Acesso do Sistema</div>
          <div className="mt-1 text-sm text-slate-300">
            Digite a senha para acessar o painel da clínica.
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm text-slate-300">Senha</label>
            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              type="password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="••••••••"
            />
            <button
              onClick={entrar}
              className="w-full rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-900 hover:bg-white"
            >
              Entrar
            </button>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            * Depois a gente troca isso por login Supabase + permissões.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={sair}
        className="fixed bottom-4 right-4 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900"
        title="Sair"
      >
        Sair
      </button>
      {children}
    </div>
  );
}