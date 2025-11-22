"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function CadastroDF() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");

  const cadastrar = async () => {
    alert("Cadastro realizado com sucesso!");
    router.push("/dfdistribuidora/login");
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

      <h1 className="text-2xl font-bold mb-6">Cadastro — DF Distribuidora</h1>

      <div className="bg-white shadow-md rounded p-6 w-full max-w-sm">

        <label className="block mb-1 font-semibold">Nome Completo</label>
        <input
          type="text"
          placeholder="Seu nome…"
          value={nome}
          onChange={e => setNome(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />

        <label className="block mb-1 font-semibold">CPF</label>
        <input
          type="text"
          placeholder="Digite seu CPF…"
          value={cpf}
          onChange={e => setCpf(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />

        <label className="block mb-1 font-semibold">Telefone</label>
        <input
          type="text"
          placeholder="(11) 90000-0000"
          value={telefone}
          onChange={e => setTelefone(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />

        <label className="block mb-1 font-semibold">Senha</label>
        <input
          type="password"
          placeholder="Crie uma senha…"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />

        <button
          onClick={cadastrar}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Cadastrar
        </button>

        <button
          onClick={() => router.push("/dfdistribuidora/login")}
          className="w-full mt-3 bg-gray-300 py-2 rounded hover:bg-gray-400 transition"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
