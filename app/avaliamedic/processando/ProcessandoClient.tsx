"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProcessandoClient() {
  const router = useRouter();
  const params = useSearchParams();
  const prescricaoId = params.get("prescricao_id");

  const [status, setStatus] = useState("em_analise");

  useEffect(() => {
    if (!prescricaoId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/avaliamedic/api/status?prescricao_id=${prescricaoId}`
        );

        const json = await res.json();
        setStatus(json.status);

        console.log("STATUS ATUAL:", json.status);

        // STATUS QUE FINALIZAM O PROCESSO
        if (
          json.status === "parecer_concluido" ||
          json.status === "erro_ocr" ||
          json.status === "erro_extracao" ||
          json.status === "sem_itens"
        ) {
          clearInterval(interval);
          router.push(`/avaliamedic/relatorio?prescricao_id=${prescricaoId}`);
        }

      } catch (e) {
        console.error("Erro ao checar status:", e);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [prescricaoId, router]);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold text-emerald-700">
        Analisando prescrição...
      </h1>

      <p className="text-gray-600 mt-2">
        Estamos aplicando protocolos clínicos e identificando riscos
      </p>

      <div className="mt-8 flex items-center gap-3 text-emerald-700">
        <Loader2 className="animate-spin w-8 h-8" />
        <span className="text-lg font-medium">
          {status === "em_analise" ? "Processando dados..." : "Finalizando..."}
        </span>
      </div>

      <div className="mt-10 bg-white shadow-md border rounded-xl p-6 w-full max-w-md">
        <p className="text-gray-700 font-medium mb-4">Etapas:</p>

        <ul className="space-y-3 text-gray-600 text-sm">
          <li>1. Extraindo medicamentos</li>
          <li>2. Interpretando doses e vias</li>
          <li>3. Consultando protocolos</li>
          <li>4. Avaliando riscos</li>
          <li>5. Gerando relatório clínico</li>
        </ul>
      </div>
    </main>
  );
}
