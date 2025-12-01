"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ParecerClient() {
  const params = useSearchParams();
  const router = useRouter();

  const prescricao_id = params.get("prescricao_id");

  const [statusFinal, setStatusFinal] = useState("");
  const [parecer, setParecer] = useState("");
  const [orientacaoEnf, setOrientacaoEnf] = useState("");
  const [obsMedico, setObsMedico] = useState("");
  const [loading, setLoading] = useState(false);

  async function salvarParecer() {
    if (!prescricao_id) {
      alert("ID da prescrição não encontrado.");
      return;
    }

    setLoading(true);

    const payload = {
      prescricao_id,
      status_final: statusFinal,
      parecer,
      orientacao_enf: orientacaoEnf,
      obs_medico: obsMedico,
    };

    const resp = await fetch("/avaliamedic/api/parecer", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const json = await resp.json();
    setLoading(false);

    if (json.sucesso) {
      router.push(`/avaliamedic/resultado?prescricao_id=${prescricao_id}`);
    } else {
      alert("Erro ao salvar parecer.");
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">Parecer Farmacêutico</h1>

      <div className="space-y-3">
        <select
          value={statusFinal}
          onChange={(e) => setStatusFinal(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">Selecione o status</option>
          <option value="ok">OK</option>
          <option value="atencao">Atenção</option>
          <option value="risco">Risco</option>
        </select>

        <textarea
          className="border p-2 rounded w-full"
          placeholder="Parecer"
          value={parecer}
          onChange={(e) => setParecer(e.target.value)}
        />

        <textarea
          className="border p-2 rounded w-full"
          placeholder="Orientação Enfermagem"
          value={orientacaoEnf}
          onChange={(e) => setOrientacaoEnf(e.target.value)}
        />

        <textarea
          className="border p-2 rounded w-full"
          placeholder="Observação Médico"
          value={obsMedico}
          onChange={(e) => setObsMedico(e.target.value)}
        />

        <button
          onClick={salvarParecer}
          disabled={loading}
          className="bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar Parecer"}
        </button>
      </div>
    </main>
  );
}
