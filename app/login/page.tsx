"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Login de ${email} realizado (simulação).`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">
          Acesse sua conta
        </h1>
        <p className="text-gray-600 mb-6">
          Faça login para acessar os serviços da plataforma IA Drogarias
        </p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-sm text-gray-700">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 border-t pt-4 text-sm text-gray-600">
          <p>Ainda não tem conta?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-3">
            <Link
              href="/cadastro-cliente"
              className="text-blue-700 hover:underline"
            >
              Sou Cliente
            </Link>
            <Link
              href="/cadastro-drogaria"
              className="text-blue-700 hover:underline"
            >
              Sou Parceiro
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
