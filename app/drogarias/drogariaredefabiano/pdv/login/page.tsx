"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LoginPDV() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
  e.preventDefault();
  setErro("");

  try {
    const { data, error } = await supabase
      .from("atendentes")
      .select("*")
      .ilike("usuario", usuario.trim()) // ignora maiúsculas/minúsculas
      .eq("senha", senha.trim()) // compara senha exata
      .maybeSingle(); // evita erro se não encontrar

    if (error || !data) {
      setErro("Usuário ou senha incorretos!");
      console.error("Erro Supabase:", error);
      return;
    }

    // salva dados no localStorage
    localStorage.setItem(
      "atendente",
      JSON.stringify({
        id: data.id,
        nome: data.nome,
        usuario: data.usuario,
        loja: data.loja,
      })
    );

    // redireciona
    router.push("/drogarias/drogariaredefabiano/pdv");
  } catch (err) {
    console.error("Erro inesperado:", err);
    setErro("Erro ao tentar logar. Tente novamente.");
  }
}

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-blue-100">
        <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">
          💻 Login PDV — Drogaria Rede Fabiano
        </h1>

        <form onSubmit={handleLogin}>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Usuário
          </label>
          <input
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="w-full border rounded p-2 mb-4 focus:outline-blue-600"
            placeholder="Digite seu usuário"
            required
          />

          <label className="block mb-2 text-sm font-medium text-gray-700">
            Senha
          </label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border rounded p-2 mb-4 focus:outline-blue-600"
            placeholder="Digite sua senha"
            required
          />

          {erro && (
            <p className="text-red-600 text-center text-sm mb-3">{erro}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded-md transition"
          >
            Entrar
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-6">
          © 2025 IA Drogarias — Saúde com Inteligência 💙
        </p>
      </div>
    </main>
  );
}