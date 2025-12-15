"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginGigante() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function login(e: React.FormEvent) {
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
      return;
    }

    router.push("/gigante/pedido");
  }

  async function registrar() {
    setErro("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }

    router.push("/gigante/completar-cadastro");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <form
        onSubmit={login}
        className="bg-white p-6 rounded-xl shadow w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold text-center mb-4">
          🍖 Gigante dos Assados
        </h1>

        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded p-2 mb-2"
          required
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border rounded p-2 mb-3"
          required
        />

        {erro && <p className="text-red-600 text-sm mb-2">{erro}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 rounded"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <button
          type="button"
          onClick={registrar}
          className="w-full mt-2 border border-red-600 text-red-600 py-2 rounded"
        >
          Criar conta
        </button>
      </form>
    </div>
  );
}
