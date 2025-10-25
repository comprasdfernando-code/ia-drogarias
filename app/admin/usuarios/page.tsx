"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");

  // ✅ Verifica login
  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push("/login");
    }
    checkAuth();
  }, []);

  // 👀 (Opcional) Carregar lista de usuários (visão administrativa)
  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, email, criado_em")
        .order("criado_em", { ascending: false });
      if (!error && data) setUsuarios(data);
    }
    fetchUsers();
  }, []);

  // ➕ Criar novo usuário
  async function criarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setMensagem("");

    // Cria o usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      setMensagem("❌ Erro: " + error.message);
      return;
    }

    // (Opcional) salva no banco para listar usuários
    await supabase.from("usuarios").insert({
      email,
      criado_em: new Date().toISOString(),
    });

    setMensagem("✅ Usuário criado com sucesso!");
    setEmail("");
    setSenha("");
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">
        👤 Gerenciar Usuários — PDV IA Drogarias
      </h1>

      <form
        onSubmit={criarUsuario}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          ➕ Criar Novo Usuário
        </h2>
        {mensagem && (
          <div className="bg-blue-50 text-blue-700 p-2 rounded mb-3 text-sm">
            {mensagem}
          </div>
        )}
        <input
          type="email"
          placeholder="E-mail do novo usuário"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded mb-3 focus:outline-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border p-2 rounded mb-4 focus:outline-blue-500"
          required
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-md transition"
        >
          Criar Usuário
        </button>
      </form>

      {/* 📋 Lista de usuários cadastrados */}
      {usuarios.length > 0 && (
        <div className="bg-white shadow rounded-lg p-5">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            📋 Usuários Cadastrados
          </h2>
          <table className="w-full border-collapse border text-sm">
            <thead className="bg-blue-50 border-b text-gray-700">
              <tr>
                <th className="border p-2">E-mail</th>
                <th className="border p-2">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="border p-2">{u.email}</td>
                  <td className="border p-2">
                    {new Date(u.criado_em).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}