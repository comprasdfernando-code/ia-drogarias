"use client";

import { useState } from "react";

// 🔗 COLE AQUI O LINK DO SEU SCRIPT (termina com /exec)
const SHEETS_ENDPOINT =
  "https://script.google.com/macros/s/SEU_LINK_CORRETO_AQUI/exec";

export default function CadastroFarmaceutico() {
  const initialForm = {
    nome: "",
    cpf: "",
    crf: "",
    telefone: "",
    email: "",
    cidade: "",
    bairro: "",
    cep: "",
    endereco: "",
    areaAtuacao: "",
    possuiCnpj: "",
    disponibilidade: "",
    valorAtendimento: "",
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

  // ⬇️ ENVIA PARA O GOOGLE SHEETS E ABRE O WHATSAPP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!SHEETS_ENDPOINT.includes("https://script.google.com")) {
      alert("⚠️ Configure o link do Apps Script antes de enviar.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${SHEETS_ENDPOINT}?tipo=farmaceutico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Falha ao enviar");

      // Mensagem automática para o WhatsApp comercial
      const msg = encodeURIComponent(
        `Olá! 👋 Sou farmacêutico e acabei de me cadastrar na plataforma IA Drogarias — Saúde com Inteligência. 💙`
      );

      // ✅ Abre WhatsApp comercial automaticamente
      window.open(`https://wa.me/5511952068432?text=${msg}`, "_blank");

      alert("Cadastro enviado com sucesso! 🎉");
      setForm(initialForm);
    } catch (err) {
      alert("❌ Erro ao enviar cadastro. Verifique sua internet e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          Cadastro de Farmacêuticos
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
            name="cpf"
            onChange={handleChange}
            value={form.cpf}
            placeholder="CPF"
            required
            className="input"
          />
          <input
            name="crf"
            onChange={handleChange}
            value={form.crf}
            placeholder="CRF / Estado"
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
            name="cidade"
            onChange={handleChange}
            value={form.cidade}
            placeholder="Cidade"
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
            name="cep"
            onChange={handleChange}
            value={form.cep}
            placeholder="CEP"
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
            name="areaAtuacao"
            onChange={handleChange}
            value={form.areaAtuacao}
            placeholder="Área de atuação (Clínica, Estética...)"
            className="input"
          />
          <select
            name="possuiCnpj"
            onChange={handleChange}
            value={form.possuiCnpj}
            className="input"
          >
            <option value="">Possui CNPJ ou MEI?</option>
            <option value="Sim">Sim</option>
            <option value="Não">Não</option>
          </select>
          <input
            name="disponibilidade"
            onChange={handleChange}
            value={form.disponibilidade}
            placeholder="Dias e horários disponíveis"
            className="input"
          />
          <input
            name="valorAtendimento"
            onChange={handleChange}
            value={form.valorAtendimento}
            placeholder="Valor sugerido por atendimento (opcional)"
            className="input"
          />

          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" required />
            <span>Declaro que sou profissional ativo e aceito os termos de uso.</span>
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
