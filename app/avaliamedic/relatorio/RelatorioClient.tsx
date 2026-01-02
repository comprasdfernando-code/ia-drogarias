"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function RelatorioClient() {
  const params = useSearchParams();
  const prescricao_id = params.get("prescricao_id");

  const [relatorio, setRelatorio] = useState<any[]>([]);
  const [prescricao, setPrescricao] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!prescricao_id) return;

    async function carregar() {
      try {
        const resp = await fetch(
  `/avaliamedic/api/get-prescricao?prescricao_id=${prescricao_id}`,
  { cache: "no-store" }
);


        const json = await resp.json();

        if (json.error) {
          console.error(json.error);
          setLoading(false);
          return;
        }

        // 🔥 AQUI: LENDO EXATAMENTE O QUE O BACKEND RETORNA
        setRelatorio(json.relatorio || []);
        setPrescricao(json.prescricao || {});
      } catch (e) {
        console.error("Falha ao carregar relatório", e);
      }

      setLoading(false);
    }

    carregar();
  }, [prescricao_id]);

  if (loading) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Carregando relatório...</h1>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Relatório Clínico</h1>

      {/* DADOS RESUMIDOS DA PRESCRIÇÃO */}
      {prescricao && (
        <div className="mb-6 p-4 border rounded shadow-sm bg-white">
          <p><b>Setor:</b> {prescricao.setor}</p>
          <p><b>Idade:</b> {prescricao.idade}</p>
          <p><b>Peso:</b> {prescricao.peso}</p>
          <p><b>Status final:</b> {prescricao.status}</p>
        </div>
      )}

      {/* LISTA DOS ITENS */}
      {relatorio.length === 0 ? (
        <p>Nenhum item encontrado para esta prescrição.</p>
      ) : (
        relatorio.map((item: any, index: number) => (
          <div key={index} className="border rounded p-4 mb-4 shadow-sm bg-white">
            <p><b>Medicamento:</b> {item.medicamento}</p>
            <p><b>Dose:</b> {item.dose}</p>
            <p><b>Via:</b> {item.via}</p>
            <p><b>Frequência:</b> {item.frequencia}</p>

            <p className="mt-2">
              <b>Status:</b>{" "}
              <span className="text-emerald-700">{item.status || "—"}</span>
            </p>

            <p>
              <b>Motivo:</b>{" "}
              <span className="text-gray-700">{item.motivo || "—"}</span>
            </p>
          </div>
        ))
      )}
    </main>
  );
}
