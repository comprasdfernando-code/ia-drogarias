"use client";

import { useState } from "react";

// ⬇️ COLE AQUI O LINK DO SEU SCRIPT (termina com /exec)
const SHEETS_ENDPOINT =
  "https://script.google.com/macros/s/COLE_SEU_LINK_AQUI/exec";

export default function CadastroCliente() {
  const initialForm = {
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
    bairro: "",
    cidade: "",
    cep: "",
    tipo: "",
  };

  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ⬇️ ENVIA PARA O GOOGLE SHEETS + ABRE WHATSAPP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!SHEETS_ENDPOINT.includes("https://script.google.com")) {
      alert("Configure o link do Apps Script antes de enviar.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${SHEETS_ENDPOINT}?tipo=cliente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Falha ao enviar");

      // Mensagem automática para o WhatsApp comercial
      const msg = encodeURIComponent(
        `Olá! 👋 Acabei de me cadastrar como cliente na IA Drogarias — Saúde com Inteligência. 💙`
      );

      // ✅ Redireciona automaticamente para o WhatsApp comercial
      window.open(`https://wa.me/5511952068432?text=${msg}`, "_blank");

      alert("Cadastro enviado com sucesso! 🎉");
      setForm(initialForm); // limpa o formulário
    } catch (err) {
      alert("Erro ao enviar cadastro. Verifique sua internet e tente de novo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          Cadastro de Clientes
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="nome"
            onChange={handleChange}
            value={form.nome}
            placeholder="Nome completo"
            required
            className="input"
          />
          <input
            name="telefone"
            onChange={handleChange}
            value={form.telefone}
            placeholder="Telefone / WhatsApp"
            required
            className="input"
          />
          <input
            name="email"
            onChange={handleChange}
            value={form.email}
            placeholder="E-mail"
            type="email"
            className="input"
          />
          <input
            name="endereco"
            onChange={handleChange}
            value={form.endereco}
            placeholder="Endereço completo"
            className="input"
          />
          <input
            name="bairro"
            onChange={handleChange}
            value={form.bairro}
            placeholder="Bairro"
            className="input"
          />
          <input
            name="cidade"
            onChange={handleChange}
            value={form.cidade}
            placeholder="Cidade"
            className="input"
          />
          <input
            name="cep"
            onChange={handleChange}
            value={form.cep}
            placeholder="CEP"
            className="input"
          />

          <select
            name="tipo"
            onChange={handleChange}
            value={form.tipo}
            className="input"
          >
            <option value="">Deseja...</option>
            <option value="comprar">Comprar medicamentos</option>
            <option value="atendimento">
              Solicitar atendimento farmacêutico
            </option>
          </select>

          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" required />
            <span>
              Autorizo o uso dos meus dados para atendimento e compras conforme
              LGPD.
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition"
          >
            {isSubmitting ? "Enviando..." : "Enviar Cadastro"}
          </button>
        </form>
      </div>
    </div>
  );
}
