"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Prescricao = {
  setor: string;
  idade: number | null;
  peso: number | null;
  status: string;
};

type Item = {
  id: string;
  medicamento: string;
  dose: string | null;
  via: string | null;
  frequencia: string | null;
  risco: string | null;
  motivo: string | null;
};

function riscoLabel(risco?: string | null) {
  const map: Record<string, { texto: string; cor: string }> = {
    ok: { texto: "Adequado", cor: "bg-green-100 text-green-800" },
    dose_alta: { texto: "Dose alta", cor: "bg-red-100 text-red-800" },
    dose_baixa: { texto: "Dose baixa", cor: "bg-yellow-100 text-yellow-800" },
    frequencia_inadequada: {
      texto: "Frequência inadequada",
      cor: "bg-orange-100 text-orange-800",
    },
    via_inadequada: {
      texto: "Via inadequada",
      cor: "bg-purple-100 text-purple-800",
    },
    monitoramento: {
      texto: "Precisa de monitoramento",
      cor: "bg-blue-100 text-blue-800",
    },
    risco_aumentado: {
      texto: "Risco aumentado",
      cor: "bg-red-200 text-red-900",
    },
  };

  return map[String(risco || "")] || {
    texto: risco || "Não classificado",
    cor: "bg-gray-100 text-gray-700",
  };
}

export default function RelatorioClient() {
  const params = useSearchParams();
  const prescricaoId = params.get("prescricao_id");

  const [prescricao, setPrescricao] = useState<Prescricao | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!prescricaoId) return;

    async function carregar() {
      const res = await fetch(
        `/avaliamedic/api/relatorio?prescricao_id=${prescricaoId}`,
        { cache: "no-store" }
      );

      const json = await res.json();

      setPrescricao(json.prescricao || null);
      setItens(json.relatorio || []);
      setLoading(false);
    }

    carregar();
  }, [prescricaoId]);

  if (loading) return <p className="p-6">Carregando relatório...</p>;
  if (!prescricao) return <p className="p-6">Prescrição não encontrada.</p>;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold mb-6">Relatório Clínico</h1>

      <div className="bg-white border rounded-xl p-6 mb-6">
        <p><strong>Setor:</strong> {prescricao.setor}</p>
        <p><strong>Idade:</strong> {prescricao.idade ?? "-"}</p>
        <p><strong>Peso:</strong> {prescricao.peso ?? "-"}</p>
        <p><strong>Status final:</strong> {prescricao.status}</p>
      </div>

      {itens.length === 0 && (
        <p>Nenhum item encontrado para esta prescrição.</p>
      )}

      {itens.map((item) => {
        const risco = riscoLabel(item.risco);

        return (
          <div key={item.id} className="bg-white border rounded-xl p-6 mb-4">
            <p><strong>Medicamento:</strong> {item.medicamento}</p>
            <p><strong>Dose:</strong> {item.dose || "-"}</p>
            <p><strong>Via:</strong> {item.via || "-"}</p>
            <p><strong>Frequência:</strong> {item.frequencia || "-"}</p>

            <div className="mt-3">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${risco.cor}`}
              >
                {risco.texto}
              </span>
            </div>

            <div className="mt-3 text-sm text-gray-700">
              <strong>Motivo:</strong> {item.motivo || "-"}
            </div>
          </div>
        );
      })}
    </main>
  );
}
