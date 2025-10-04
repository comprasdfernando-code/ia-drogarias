"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AgendaPage() {
  const searchParams = useSearchParams();
  const servico = searchParams.get("servico") || "Serviço não informado";

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    alert("Agendamento feito com sucesso!\n\nNome: ${nome}\nTelefone: ${telefone}\nServiço: ${servico}\nData: ${data} às ${hora}");

    // 🔹 Futuro: enviar pro WhatsApp automaticamente
    // const mensagem = Olá, quero confirmar meu agendamento:\n\n📌 Serviço: ${servico}\n👤 Nome: ${nome}\n📱 Telefone: ${telefone}\n📅 Data: ${data}\n⏰ Horário: ${hora};
    // window.open(https://wa.me/55SEUNUMERO?text=${encodeURIComponent(mensagem)});
  };

  return (
    <main className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-xl mt-6">
      <h1 className="text-2xl font-semibold mb-4 text-center">Agendamento</h1>

      <p className="text-gray-600 mb-6 text-center">
        Você está agendando:Você está agendando: <span className="font-bold">{servico}</span>
</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Telefone (WhatsApp)</label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Horário</label>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            required
            className="w-full border rounded-lg p-2"
          />
        </div>

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