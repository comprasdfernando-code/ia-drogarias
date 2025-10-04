"use client";

import { useState } from "react";

export default function CadastroDrogariaPage() {
  const [fantasia, setFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [resp, setResp] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const mensagem = `
      Cadastro de Drogaria
      Nome Fantasia: ${fantasia}
      CNPJ: ${cnpj}
      Responsável: ${resp}
    `;

    alert(mensagem);

    // 👉 futuro: enviar pro WhatsApp
    // window.open(https://wa.me/55SEUNUMERO?text=${encodeURIComponent(mensagem)});
  };

  return (
    <main className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-xl mt-6">
      <h1 className="text-2xl font-semibold mb-4 text-center">Cadastro de Drogaria</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Nome Fantasia</label>
          <input
            type="text"
            value={fantasia}
            onChange={(e) => setFantasia(e.target.value)}
            required
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">CNPJ</label>
          <input
            type="text"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            required
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Responsável</label>
          <input
            type="text"
            value={resp}
            onChange={(e) => setResp(e.target.value)}
            required
            className="w-full border rounded-lg p-2"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Confirmar Cadastro
        </button>
      </form>
    </main>
  );
}