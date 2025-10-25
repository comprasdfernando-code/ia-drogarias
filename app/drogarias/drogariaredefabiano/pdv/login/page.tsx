"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LoginPDV() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("usuarioPDV");
    if (user) router.push("/drogarias/drogariaredefabiano/pdv");
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro("❌ E-mail ou senha incorretos.");
      setCarregando(false);
      return;
    }

    // guarda o usuário no navegador
    localStorage.setItem("usuarioPDV", JSON.stringify(data.user));
    router.push("/drogarias/drogariaredefabiano/pdv");
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-blue-50">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-sm text-center">
        <img
          src="https://iadrogarias.com.br/logo-ia.png"
          alt="IA Drogarias"
          className="w-20 mx-auto mb-4"
        />

        <h1 className="text-2xl font-bold text-blue-700 mb-6">
          🔒 Acesso ao PDV
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded-md p-2 focus:outline-blue-500"
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className="w-full border rounded-md p-2 focus:outline-blue-500"
          />
          {erro && <p className="text-red-600 text-sm">{erro}</p>}
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition"
          >
            {carregando ? "Entrando..." : "Entrar no PDV"}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4">
          © {new Date().getFullYear()} IA Drogarias — Drogaria Rede Fabiano
        </p>
      </div>
    </main>
  );
}