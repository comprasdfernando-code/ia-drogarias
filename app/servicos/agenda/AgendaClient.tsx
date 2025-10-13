"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AgendaPage() {
  const searchParams = useSearchParams();
  const servicoURL = searchParams.get("servico") || "";

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    servico: "",
    data: "",
    horario: "",
    observacoes: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
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

    console.log("🚀 Enviando para API:", form);

    try {
      const response = await fetch("/api/sendMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();
      console.log("✅ Resposta da API:", result);

      if (response.ok) {
        toast.success(`Agendamento confirmado para ${form.data} às ${form.horario}!`, {
          position: "top-center",
          autoClose: 3000,
          theme: "colored",
        });

        // Limpa o formulário após sucesso
        setForm({
          nome: "",
          telefone: "",
          endereco: "",
          servico: servicoURL,
          data: "",
          horario: "",
          observacoes: "",
        });
      } else {
        toast.error("❌ Erro ao salvar agendamento. Tente novamente.", {
          position: "top-center",
          autoClose: 4000,
          theme: "colored",
        });
      }
    } catch (error) {
      console.error("Erro no envio:", error);
      toast.error("⚠️ Erro de conexão com o servidor.", {
        position: "top-center",
        autoClose: 4000,
        theme: "colored",
      });
    }
  };

  return (
    <main className="flex flex-col items-center justify-center py-10">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-center text-2xl font-bold text-blue-700 mb-6">
          Agendamento de Serviços
        </h1>

        <form onSubmit={handleSubmit}>
          <input
            name="nome"
            type="text"
            placeholder="Seu nome completo"
            value={form.nome}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-3"
            required
          />

          <input
            name="telefone"
            type="text"
            placeholder="WhatsApp (apenas números)"
            value={form.telefone}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-3"
            required
          />

          <input
            name="endereco"
            type="text"
            placeholder="Endereço completo"
            value={form.endereco}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-3"
          />

          <input
            name="servico"
            type="text"
            placeholder="Serviço desejado"
            value={form.servico}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-3 bg-gray-100 cursor-not-allowed"
            readOnly
          />

          <input
            name="data"
            type="date"
            value={form.data}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-3"
            required
          />

          <input
            name="horario"
            type="time"
            value={form.horario}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-3"
            required
          />

          <textarea
            name="observacoes"
            placeholder="Observações (opcional)"
            value={form.observacoes}
            onChange={handleChange}
            className="w-full border p-2 rounded mb-3"
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded"
          >
            Confirmar Agendamento
          </button>
        </form>
      </div>

      {/* Container que exibe os toasts */}
      <ToastContainer />
    </main>
  );
}
