export const dynamic = "force-static";

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ParecerFarmaceutico() {
  const router = useRouter();
  const params = useSearchParams();

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
      orientacao_enfermagem: orientacaoEnf,
      observacao_medico: obsMedico,
      criado_por: "farmaceutico-001" // depois vinculamos ao login real
    };

    const res = await fetch("/avaliamedic/api/parecer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (json.sucesso) {
      router.push(`/avaliamedic/resultado?prescricao_id=${prescricao_id}`);
    } else {
      alert("Erro ao salvar o parecer.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">

      {/* Título */}
      <h1 className="text-3xl font-semibold text-emerald-700">
        Parecer Farmacêutico
      </h1>
      <p className="text-gray-600 mt-1">
        Registre seu parecer clínico sobre a prescrição analisada
      </p>

      {/* CARD */}
      <div className="mt-8 bg-white border shadow-lg rounded-2xl p-8 max-w-3xl mx-auto">

        <div className="space-y-6">

          {/* Status final */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Status da Prescrição
            </label>
            <select
              value={statusFinal}
              onChange={(e) => setStatusFinal(e.target.value)}
              className="w-full mt-1 p-3 border rounded-lg bg-white focus:ring-2 focus:ring-emerald-600"
            >
              <option value="">Selecione...</option>
              <option value="ok">Prescrição Segura (OK)</option>
              <option value="atencao">Atenção – Ajustes Recomendados</option>
              <option value="risco_alto">Risco Alto – Revisão Necessária</option>
              <option value="risco_grave">Risco Grave – Não Administrar</option>
            </select>
          </div>

          {/* Parecer técnico */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Parecer Técnico
            </label>
            <textarea
              value={parecer}
              onChange={(e) => setParecer(e.target.value)}
              className="w-full mt-1 p-3 min-h-[180px] border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
              placeholder="Descreva aqui sua análise clínica, justificativa e orientações..."
            />
          </div>

          {/* Orientações para enfermagem */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Orientações para Enfermagem
            </label>
            <textarea
              value={orientacaoEnf}
              onChange={(e) => setOrientacaoEnf(e.target.value)}
              className="w-full mt-1 p-3 min-h-[120px] border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
              placeholder="Ex: Ajustar dose para mg/kg, verificar via correta, não administrar EV..."
            />
          </div>

          {/* Observações ao médico */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Observações ao Médico (opcional)
            </label>
            <textarea
              value={obsMedico}
              onChange={(e) => setObsMedico(e.target.value)}
              className="w-full mt-1 p-3 min-h-[100px] border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
              placeholder="Ex: Sugestão de ajuste terapêutico ou alerta clínico relevante..."
            />
          </div>

          {/* Botão */}
          <button
            onClick={salvarParecer}
            disabled={loading}
            className="w-full bg-emerald-700 text-white p-3 rounded-lg font-medium hover:bg-emerald-800 transition disabled:opacity-70"
          >
            {loading ? "Salvando..." : "Salvar Parecer"}
          </button>
        </div>
      </div>

      {/* LINK VOLTAR */}
      <div className="text-center mt-6">
        <Link
          href={`/avaliamedic/relatorio?prescricao_id=${prescricao_id}`}
          className="text-emerald-700 hover:underline font-medium"
        >
          ← Voltar ao Relatório
        </Link>
      </div>

    </main>
  );
}
