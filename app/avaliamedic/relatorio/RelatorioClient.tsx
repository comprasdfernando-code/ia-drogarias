"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function RelatorioClient() {
  const params = useSearchParams();
  const prescricao_id = params.get("prescricao_id");

  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!prescricao_id) return;

    async function carregar() {
      const resp = await fetch(`/avaliamedic/api/get-prescricao?prescricao_id=${prescricao_id}`);
      const json = await resp.json();
      setDados(json);
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

  if (!dados) {
    return (
      <main className="p-6">
        <h1 className="text-xl text-red-600 font-semibold">Erro ao carregar relatório</h1>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Relatório Clínico</h1>

      {dados.relatorio?.map((item: any, index: number) => (
        <div key={index} className="border rounded p-3 mb-3">
          <p><b>Medicamento:</b> {item.medicamento}</p>
          <p><b>Dose:</b> {item.dose}</p>
          <p><b>Via:</b> {item.via}</p>
          <p><b>Frequência:</b> {item.frequencia}</p>
          <p><b>Status:</b> {item.status}</p>
          <p><b>Motivo:</b> {item.motivo}</p>
        </div>
      ))}
    </main>
  );
}
