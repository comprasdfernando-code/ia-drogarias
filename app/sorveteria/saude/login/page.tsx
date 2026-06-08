"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SaudeLoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);

    if (error) alert(error.message);
  }

  async function cadastrar() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password: senha });
    setLoading(false);
    if (error) return alert(error.message);
    alert("Cadastro criado! Se precisar confirmar e-mail, verifique sua caixa de entrada.");
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Saúde — Login</h1>
      <p className="mt-1 text-sm text-slate-600">Acesse para registrar glicemia e pressão.</p>

      <form onSubmit={entrar} className="mt-6 space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <label className="text-sm text-slate-700">E-mail</label>
          <input className="mt-1 w-full rounded-xl border p-3"
            value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-700">Senha</label>
          <input type="password" className="mt-1 w-full rounded-xl border p-3"
            value={senha} onChange={(e)=>setSenha(e.target.value)} />
        </div>

        <button disabled={loading} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white disabled:opacity-60">
          {loading ? "Aguarde…" : "Entrar"}
        </button>

        <button type="button" onClick={cadastrar} disabled={loading}
          className="w-full rounded-xl border px-4 py-3 text-slate-900 disabled:opacity-60">
          Criar conta
        </button>
      </form>
    </div>
  );
}