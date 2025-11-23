"use client";

import { useState } from "react";

export default function LoginCliente() {
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [fase, setFase] = useState(1);

  async function enviarCodigo() {
    await fetch("/api/login/enviar-codigo", {
      method: "POST",
      body: JSON.stringify({ telefone }),
    });
    setFase(2);
  }

  async function validarCodigo() {
    const r = await fetch("/api/login/validar", {
      method: "POST",
      body: JSON.stringify({ telefone, codigo }),
    });

    const data = await r.json();
    if (data.ok) window.location.href = "/meus-pedidos";
  }

  return (
    <main className="max-w-sm mx-auto px-6 py-10">
      {fase === 1 && (
        <>
          <h1 className="text-2xl font-bold text-blue-600 mb-6">Entrar</h1>

          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="WhatsApp"
            className="w-full border p-3 rounded mb-4"
          />

          <button
            onClick={enviarCodigo}
            className="w-full py-3 bg-blue-600 text-white rounded"
          >
            Receber código
          </button>
        </>
      )}

      {fase === 2 && (
        <>
          <h1 className="text-2xl font-bold text-blue-600 mb-6">Código enviado</h1>

          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código"
            className="w-full border p-3 rounded mb-4"
          />

          <button
            onClick={validarCodigo}
            className="w-full py-3 bg-green-600 text-white rounded"
          >
            Entrar
          </button>
        </>
      )}
    </main>
  );
}
