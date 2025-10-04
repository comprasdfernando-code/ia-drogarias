"use client";

import { useState } from "react";

const ADMIN_WHATS = "5511948343725";

export default function CadastroFarmaceuticoPage() {
  const [nome, setNome] = useState("");
  const [crf, setCrf] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [especialidades, setEspecialidades] = useState("");
  const [bairros, setBairros] = useState("");
  const [dispo, setDispo] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Mensagem formatada com template string
    const msg = `
Cadastro de Farmaceutico
* Nome: ${nome}
* CRF-SP: ${crf}
* WhatsApp: ${tel}
* E-mail: ${email}
* Especialidades: ${especialidades}
* Bairros/Zonas: ${bairros}
* Disponibilidade: ${dispo}
    `;

    // Montando link para enviar no WhatsApp
    const url = https://wa.me/${ADMIN_WHATS}?text=${encodeURIComponent(msg)};
    window.open(url, "_blank");
  }

  return (
    <main className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">Cadastro de Farmacêutico</h1>
      <p className="text-gray-600 mb-6">
        Preencha seus dados para participar do piloto.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-4 rounded-2xl border"
      >
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Nome completo"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="CRF-SP"
          required
          value={crf}
          onChange={(e) => setCrf(e.target.value)}
        />
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Telefone / WhatsApp"
          required
          value={tel}
          onChange={(e) => setTel(e.target.value)}
        />
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <textarea
          className="w-full rounded-lg border px-3 py-2"
          rows={2}
          placeholder="Especialidades (clínica, estética, acupuntura, vacinas...)"
          value={especialidades}
          onChange={(e) => setEspecialidades(e.target.value)}
        />
        <textarea
          className="w-full rounded-lg border px-3 py-2"
          rows={2}
          placeholder="Bairros/Zonas de atuação"
          value={bairros}
          onChange={(e) => setBairros(e.target.value)}
        />
        <textarea
          className="w-full rounded-lg border px-3 py-2"
          rows={2}
          placeholder="Disponibilidade de horários"
          value={dispo}
          onChange={(e) => setDispo(e.target.value)}
        />
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Enviar pelo WhatsApp
        </button>
      </form>
    </main>
  );
}