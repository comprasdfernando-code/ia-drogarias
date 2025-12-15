"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginGigante() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 Listener de autenticação (seguro)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          router.replace("/gigante/completar-cadastro");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  // 🔑 LOGIN
  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro("E-mail ou senha inválidos");
      setLoading(false);
    }
  }

  // 🆕 CRIAR CONTA
  async function criarConta() {
    setErro("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      setErro(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <form className="bg-white p-6 rounded-xl shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-4">
          🍖 Gigante dos Assados
        </h1>

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded mb-2"
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border p-2 rounded mb-3"
          required
        />

        {erro && <p className="text-red-600 text-sm mb-2">{erro}</p>}

        {/* ✅ SUBMIT DE LOGIN */}
        <button
          type="submit"
          onClick={entrar}
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 rounded"
        >
          Entrar
        </button>

        {/* ✅ BOTÃO NORMAL (SEM SUBMIT) */}
        <button
          type="button"
          onClick={criarConta}
          disabled={loading}
          className="w-full mt-2 border border-red-600 text-red-600 py-2 rounded"
        >
          Criar conta
        </button>
      </form>
    </div>
  );
}
