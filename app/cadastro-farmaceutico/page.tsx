"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function CadastroFarmaceutico() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1️⃣ Cria o usuário no Auth
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
        options: { data: { nome: form.nome, telefone: form.telefone } },
      });

      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) throw new Error("Erro ao criar usuário.");

      // 2️⃣ Salva na tabela "usuarios" com tipo 'farmaceutico'
      const { error: insertError } = await supabase.from("usuarios").insert([
        {
          user_id: userId,
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          tipo: "farmaceutico",
        },
      ]);

      if (insertError) throw insertError;

      alert("✅ Farmacêutico cadastrado com sucesso!");
      setForm({ nome: "", email: "", senha: "", telefone: "" });
    } catch (err: any) {
      alert("❌ Erro: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-blue-700 text-center">
          Cadastro de Farmacêutico
        </h1>

        <input
          name="nome"
          placeholder="Nome completo"
          value={form.nome}
          onChange={handleChange}
          required
          className="input"
        />

        <input
          name="email"
          placeholder="E-mail"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          className="input"
        />

        <input
          name="senha"
          placeholder="Senha"
          type="password"
          value={form.senha}
          onChange={handleChange}
          required
          className="input"
        />

        <input
          name="telefone"
          placeholder="Telefone / WhatsApp"
          value={form.telefone}
          onChange={handleChange}
          required
          className="input"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          {isSubmitting ? "Enviando..." : "Cadastrar"}
        </button>
      </form>
    </div>
  );
}