"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function AgendaForm() {
  const searchParams = useSearchParams();
  // ✅ Corrigido: decodifica o nome do serviço
  const servicoParam = searchParams.get("servico");
  const servico = servicoParam ? decodeURIComponent(servicoParam) : "Serviço não informado";

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert(
      `Agendamento feito com sucesso!\n
Nome: ${nome}\n
Telefone: ${telefone}\n
Serviço: ${servico}\n
Data: ${data} às ${hora}`
    );
  }

  return (
    <main className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-xl mt-6">
      <h1 className="text-2xl font-semibold mb-4 text-center">Agendamento</h1>
      <p className="text-gray-600 mb-6 text-center">
        Você está agendando: <span className="font-bold text-blue-600">{servico}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="w-full border rounded-lg p-2"
        />
        <input
          type="text"
          placeholder="Telefone (WhatsApp)"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          required
          className="w-full border rounded-lg p-2"
        />
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
          className="w-full border rounded-lg p-2"
        />
        <input
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          required
          className="w-full border rounded-lg p-2"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Confirmar Agendamento
        </button>
      </form>
    </main>
  );
}

// ✅ Corrigido com Suspense
export default function AgendaPage() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Carregando serviço...</p>}>
      <AgendaForm />
    </Suspense>
  );
}