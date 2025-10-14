"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 🔗 Conexão com Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AgendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const servicoURL = searchParams.get("servico") || "";

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    servico: servicoURL,
    data: "",
    horario: "",
    observacoes: "",
  });

  useEffect(() => {
    if (servicoURL) {
      setForm((prev) => ({ ...prev, servico: servicoURL }));
    }
  }, [servicoURL]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("agendamentos").insert([form]);
    if (error) {
      toast.error("❌ Erro ao salvar agendamento!");
      console.error(error);
    } else {
      toast.success("✅ Agendamento realizado com sucesso!");
      setForm({
        nome: "",
        telefone: "",
        endereco: "",
        servico: servicoURL,
        data: "",
        horario: "",
        observacoes: "",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-white shadow-lg rounded-xl p-6 relative">
      {/* 🔹 Botão Voltar */}
      <button
        onClick={() => router.push("/servicos")}
        className="absolute top-4 left-4 bg-blue-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg shadow-md hover:bg-blue-700 transition"
      >
        ← Voltar
      </button>

      <h2 className="text-2xl font-bold text-center text-blue-700 mb-4 mt-6">
        Agendamento de Serviço
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          name="nome"
          placeholder="Nome completo"
          value={form.nome}
          onChange={handleChange}
          className="border rounded-lg p-2"
          required
        />
        <input
          type="text"
          name="telefone"
          placeholder="Telefone / WhatsApp"
          value={form.telefone}
          onChange={handleChange}
          className="border rounded-lg p-2"
          required
        />
        <input
          type="text"
          name="endereco"
          placeholder="Endereço completo"
          value={form.endereco}
          onChange={handleChange}
          className="border rounded-lg p-2"
        />
        <input
          type="text"
          name="servico"
          placeholder="Serviço"
          value={form.servico}
          onChange={handleChange}
          className="border rounded-lg p-2 bg-gray-100"
          readOnly
        />
        <input
          type="date"
          name="data"
          value={form.data}
          onChange={handleChange}
          className="border rounded-lg p-2"
          required
        />
        <input
          type="time"
          name="horario"
          value={form.horario}
          onChange={handleChange}
          className="border rounded-lg p-2"
        />
        <textarea
          name="observacoes"
          placeholder="Observações (opcional)"
          value={form.observacoes}
          onChange={handleChange}
          className="border rounded-lg p-2"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg mt-2"
        >
          Confirmar Agendamento
        </button>
      </form>

      <ToastContainer position="top-center" />
    </div>
  );
}
