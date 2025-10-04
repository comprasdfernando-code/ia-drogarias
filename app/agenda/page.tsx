"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function AgendaContent() {
  const searchParams = useSearchParams();
  const servico = searchParams.get("servico") || "Serviço não informado";

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert(
      Agendamento feito com sucesso!
      Nome: ${nome}
      Telefone: ${telefone}
      Serviço: ${servico}
      Data: ${data} às ${hora}
    );
  }

  return (
    <main className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Agendamento</h1>
      <p className="mb-4">Você está agendando: <strong>{servico}</strong></p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          placeholder="Telefone (WhatsApp)"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Confirmar Agendamento
        </button>
      </form>
    </main>
  );
}

export default function AgendaPage() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <AgendaContent />
    </Suspense>
  );
}