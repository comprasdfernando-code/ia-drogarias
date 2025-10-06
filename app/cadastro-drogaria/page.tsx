"use client";

import { useState } from "react";

export default function CadastroDrogariaPage() {
  const [form, setForm] = useState({
    fantasia: "",
    cnpj: "",
    responsavel: "",
    telefone: "",
    cidade: "",
    bairro: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const mensagem = `
🏪 *Cadastro de Drogaria - IA Drogarias*

📌 Nome Fantasia: ${form.fantasia}
🧾 CNPJ: ${form.cnpj}
👤 Responsável: ${form.responsavel}
📞 Telefone: ${form.telefone}
📍 Cidade: ${form.cidade}
🏘️ Bairro: ${form.bairro}
`;

    // 👉 Envia direto pro WhatsApp comercial
    const msg = encodeURIComponent(mensagem);
    window.open(`https://wa.me/5511952068432?text=${msg}`, "_blank");

    alert("Cadastro enviado com sucesso! 🎉");
    setForm({
      fantasia: "",
      cnpj: "",
      responsavel: "",
      telefone: "",
      cidade: "",
      bairro: "",
    });
  };

  return (
    <main className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-2xl mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center text-blue-700">
        Cadastro de Drogarias
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Nome Fantasia
          </label>
          <input
            name="fantasia"
            value={form.fantasia}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">CNPJ</label>
          <input
            name="cnpj"
            value={form.cnpj}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">
            Responsável
          </label>
          <input
            name="responsavel"
            value={form.responsavel}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-gray-700">Telefone</label>
          <input
            name="telefone"
            value={form.telefone}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Cidade</label>
            <input
              name="cidade"
              value={form.cidade}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Bairro</label>
            <input
              name="bairro"
              value={form.bairro}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          Confirmar Cadastro
        </button>
      </form>
    </main>
  );
}
