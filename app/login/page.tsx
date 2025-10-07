"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro("❌ E-mail ou senha incorretos.");
    } else {
      router.push("/"); // redireciona pra página inicial
    }

    setCarregando(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          🔐 Login - IA Drogarias
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
          />

          {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-gray-600">
          Ainda não tem conta?{" "}
          <a href="/cadastro" className="text-blue-600 font-semibold hover:underline">
            Cadastre-se aqui
          </a>
        </p>
      </div>
    </div>
  );
}
