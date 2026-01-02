"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Prescricao = {
  setor: string;
  idade: number;
  peso: number;
  status: string;
};

type Item = {
  id: string;
  medicamento: string;
  dose: string;
  via: string;
  frequencia: string;
  risco: string;
};

function riscoLabel(risco: string) {
  const map: Record<string, string> = {
    ok: "Adequado",
    dose_alta: "Dose alta",
    dose_baixa: "Dose baixa",
    frequencia_inadequada: "Frequência inadequada",
    via_inadequada: "Via inadequada",
    monitoramento: "Precisa de monitoramento",
    risco_aumentado: "Risco aumentado",
  };

  return map[risco] || risco || "Não classificado";
}

export default function RelatorioClient() {
  const params = useSearchParams();
  const prescricaoId = params.get("prescricao_id");

  const [prescricao, setPrescricao] = useState<Prescricao | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!prescricaoId) {
      setErro("prescricao_id não informado");
      setLoading(false);
      return;
    }

    async function carregar() {
      try {
        const res = await fetch(
          `/avaliamedic/api/relatorio?prescricao_id=${prescricaoId}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          const txt = await res.text();
          console.error("Erro API:", res.status, txt);
          setErro("Erro ao carregar relatório");
          setLoading(false);
          return;
        }

        const json = await res.json();
        setPrescricao(json.prescricao);
        setItens(json.relatorio || []);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setErro("Falha de comunicação com o servidor");
        setLoading(false);
      }
    }

    carregar();
  }, [prescricaoId]);

  if (loading) return <p className="p-6">Carregando relatório...</p>;
  if (erro) return <p className="p-6 text-red-600">{erro}</p>;
  if (!prescricao) return <p className="p-6">Prescrição não encontrada.</p>;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold mb-6">Relatório Clínico</h1>

      <div className="bg-white border rounded-xl p-6 mb-6">
        <p><strong>Setor:</strong> {prescricao.setor}</p>
        <p><strong>Idade:</strong> {prescricao.idade}</p>
        <p><strong>Peso:</strong> {prescricao.peso}</p>
        <p><strong>Status final:</strong> {prescricao.status}</p>
      </div>

      {itens.length === 0 && (
        <p>Nenhum item encontrado para esta prescrição.</p>
      )}

      {itens.map((item) => (
        <div key={item.id} className="bg-white border rounded-xl p-6 mb-4">
          <p><strong>Medicamento:</strong> {item.medicamento}</p>
          <p><strong>Dose:</strong> {item.dose || "-"}</p>
          <p><strong>Via:</strong> {item.via || "-"}</p>
          <p><strong>Frequência:</strong> {item.frequencia || "-"}</p>
          <p><strong>Risco:</strong> {riscoLabel(item.risco)}</p>
        </div>
      ))}
    </main>
  );
}
