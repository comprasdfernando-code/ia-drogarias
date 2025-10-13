"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState("cliente");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, tipo },
      },
    });

    if (error) {
      setErro("❌ Erro ao cadastrar. Tente outro e-mail.");
    } else {
      setSucesso("✅ Cadastro realizado! Verifique seu e-mail para confirmar.");
      setTimeout(() => router.push("/login"), 2500);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          🧾 Cadastro - IA Drogarias
        </h1>

        <form onSubmit={handleCadastro} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-400 outline-none"
          />

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

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
          >
            <option value="cliente">Cliente</option>
            <option value="farmaceutico">Farmacêutico</option>
            <option value="drogaria">Drogaria</option>
          </select>

          {erro && <p className="text-red-500 text-sm text-center">{erro}</p>}
          {sucesso && <p className="text-green-600 text-sm text-center">{sucesso}</p>}

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition"
          >
            Cadastrar
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-gray-600">
          Já tem conta?{" "}
          <a href="/login" className="text-blue-600 font-semibold hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </div>
  );
}
