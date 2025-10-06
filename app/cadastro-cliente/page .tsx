"use client";

import { useState } from "react";

export default function CadastroClientePage() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Cliente cadastrado: ${form.nome} (${form.email})`);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">
          Cadastro de Cliente
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="nome"
            placeholder="Nome completo"
            onChange={handleChange}
            value={form.nome}
            required
            className="input"
          />
          <input
            name="email"
            type="email"
            placeholder="E-mail"
            onChange={handleChange}
            value={form.email}
            required
            className="input"
          />
          <input
            name="telefone"
            placeholder="Telefone / WhatsApp"
            onChange={handleChange}
            value={form.telefone}
            required
            className="input"
          />
          <input
            name="senha"
            type="password"
            placeholder="Crie uma senha"
            onChange={handleChange}
            value={form.senha}
            required
            className="input"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Finalizar Cadastro
          </button>
        </form>
      </div>
    </main>
  );
}
