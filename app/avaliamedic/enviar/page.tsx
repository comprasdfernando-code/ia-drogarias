"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnviarPrescricao() {
  const router = useRouter();

  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);

    const form = e.target;
    const data = new FormData(form);

    // Chamada ao endpoint da IA
    const response = await fetch("/avaliamedic/api/analisar", {
      method: "POST",
      body: data,
    });

    const json = await response.json();

    if (json.prescricao_id) {
      router.push(`/avaliamedic/processando?prescricao_id=${json.prescricao_id}`);
    } else {
      alert("Erro ao enviar a prescrição.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto bg-black border shadow-lg rounded-2xl p-8">

        <h1 className="text-3xl font-semibold text-emerald-700">
          Enviar Prescrição
        </h1>
        <p className="text-gray-600 mt-1">
          Envie a foto ou PDF para análise inteligente.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          
          {/* SETOR */}
          <div>
            <label className="text-sm font-medium text-gray-700">Setor</label>
            <select
              name="setor"
              className="w-full mt-1 p-3 border rounded-lg bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
            >
              <option>Pronto Atendimento</option>
              <option>UTI</option>
              <option>UTI Neonatal</option>
              <option>Obstetrícia</option>
              <option>Internação</option>
              <option>Farmácia</option>
            </select>
          </div>

          {/* IDADE */}
          <div>
            <label className="text-sm font-medium text-gray-700">Idade</label>
            <input
              name="idade"
              type="number"
              placeholder="Ex: 32"
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
            />
          </div>

          {/* PESO */}
          <div>
            <label className="text-sm font-medium text-gray-700">Peso (kg)</label>
            <input
              name="peso"
              type="number"
              placeholder="Ex: 68"
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
            />
          </div>

          {/* ARQUIVO */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Arquivo da prescrição
            </label>

            <label className="w-full mt-2 flex flex-col items-center justify-center border-2 border-dashed border-emerald-600 rounded-xl p-6 cursor-pointer hover:bg-emerald-50 transition">
              <input
                type="file"
                name="arquivo"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                required
              />

              <span className="text-emerald-700 font-medium">
                Clique para selecionar o arquivo
              </span>

              {fileName && (
                <span className="mt-2 text-sm text-gray-600">{fileName}</span>
              )}
            </label>
          </div>

          {/* BOTÃO */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 text-white p-3 rounded-lg font-medium hover:bg-emerald-800 transition disabled:opacity-70"
          >
            {loading ? "Enviando..." : "Enviar para Análise"}
          </button>
        </form>
      </div>
    </main>
  );
}
