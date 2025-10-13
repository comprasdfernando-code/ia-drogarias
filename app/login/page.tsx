"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    senha: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1️⃣ Login no Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.senha,
      });

      if (error) throw error;
      const user = data.user;

      // 2️⃣ Busca o tipo de usuário na tabela "usuarios"
      const { data: usuario, error: userError } = await supabase
        .from("usuarios")
        .select("tipo, nome")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (userError) throw userError;

      alert('✅ Bem-vindo, ${usuario.nome}!')

      // 3️⃣ Redireciona conforme o tipo
      if (usuario.tipo === "farmaceutico") {
        router.push("/painel-farmaceutico");
      } else {
        router.push("/produtos");
      }
    } catch (err: any) {
      alert("❌ Erro: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-blue-700 text-center">
          Login IA Drogarias
        </h1>

        <input
          name="email"
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={handleChange}
          required
          className="input"
        />

        <input
          name="senha"
          type="password"
          placeholder="Senha"
          value={form.senha}
          onChange={handleChange}
          required
          className="input"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Ainda não tem conta?{" "}
          <a href="/cadastro-cliente" className="text-blue-600 hover:underline">
            Cadastre-se
          </a>
        </p>
      </form>
    </div>
  );
}