"use client";

import { useState } from "react";
import type { Cliente } from "../page";

export default function ClienteForm({
  onAdd,
}: {
  onAdd: (cliente: Omit<Cliente, "id">) => void;
}) {
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [contato, setContato] = useState("");

  function submit() {
    onAdd({ nome, endereco, whatsapp, contato });
    setNome("");
    setEndereco("");
    setWhatsapp("");
    setContato("");
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Cadastrar cliente</h2>
        <button
          onClick={submit}
          className="rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700"
        >
          Salvar
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do cliente"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
        />
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="WhatsApp (DDD + número)"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
        />
        <input
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          placeholder="Endereço completo"
          className="md:col-span-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
        />
        <input
          value={contato}
          onChange={(e) => setContato(e.target.value)}
          placeholder="Contato / observações (ex: falar com João)"
          className="md:col-span-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Dica: você pode digitar Whats com espaços/traços — eu salvo só os números.
      </p>
    </div>
  );
}
