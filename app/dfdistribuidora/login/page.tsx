"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginDF() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");

  const fazerLogin = async () => {
    router.replace("/dfdistribuidora/pdv");

  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">

      {/* LOGO */}
      <Image
        src="/df-distribuidora-logo.png"
        alt="Logo DF Distribuidora"
        width={160}
        height={160}
        className="mb-4"
      />

      <h1 className="text-2xl font-bold mb-6">Acesso — DF Distribuidora</h1>

      <div className="bg-white shadow-md rounded p-6 w-full max-w-sm">
        <label className="block mb-1 font-semibold">CPF</label>
        <input
          type="text"
          placeholder="Digite seu CPF…"
          value={cpf}
          onChange={e => setCpf(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />

        <label className="block mb-1 font-semibold">Senha</label>
        <input
          type="password"
          placeholder="•••••••"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />

        <button
          onClick={fazerLogin}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Entrar
        </button>

        <button
          onClick={() => router.push("/dfdistribuidora/cadastro")}
          className="w-full mt-3 bg-gray-300 py-2 rounded hover:bg-gray-400 transition"
        >
          Fazer Cadastro
        </button>
      </div>
    </div>
  );
}
