"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProcessandoClient() {
  const router = useRouter();
  const params = useSearchParams();
  const prescricaoId = params.get("prescricao_id");

  const [status, setStatus] = useState("em_analise");
  const [detalhe, setDetalhe] = useState("Processando dados...");

  useEffect(() => {
    if (!prescricaoId) return;

    let cancelled = false;
    let timer: any = null;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    async function checar() {
      while (!cancelled) {
        try {
          // 1) Checa status
          const res = await fetch(
            `/avaliamedic/api/status?prescricao_id=${prescricaoId}`,
            { cache: "no-store" }
          );

          const json = await res.json();
          const st = json?.status || "em_analise";

          setStatus(st);
          console.log("STATUS ATUAL:", st);

          // Status intermediários
          if (st === "em_analise") {
            setDetalhe("Processando dados...");
          } else {
            setDetalhe("Finalizando...");
          }

          // 2) Se deu erro ou sem itens, já manda pro relatório (pra mostrar mensagem)
          if (st === "erro_ocr" || st === "erro_extracao" || st === "sem_itens") {
            router.push(`/avaliamedic/relatorio?prescricao_id=${prescricaoId}`);
            return;
          }

          // 3) Se concluiu, valida se os itens já estão disponíveis
          if (st === "parecer_concluido") {
            setDetalhe("Carregando relatório...");

            // tenta algumas vezes (ex: até ~12s) porque às vezes o insert termina depois do status
            for (let i = 0; i < 8; i++) {
              if (cancelled) return;

              const r2 = await fetch(
                `/avaliamedic/api/get-prescricao?prescricao_id=${prescricaoId}`,
                { cache: "no-store" }
              );
              const j2 = await r2.json();

              const itensCount =
                j2?.itens_count ??
                (Array.isArray(j2?.relatorio) ? j2.relatorio.length : 0);

              console.log("ITENS COUNT:", itensCount);

              if (itensCount > 0) {
                router.push(
                  `/avaliamedic/relatorio?prescricao_id=${prescricaoId}`
                );
                return;
              }

              // ainda não apareceu: espera um pouco e tenta de novo
              await sleep(1500);
            }

            // fallback: mesmo sem itens aparecerem, abre o relatório (pra não ficar travado)
            router.push(`/avaliamedic/relatorio?prescricao_id=${prescricaoId}`);
            return;
          }
        } catch (e) {
          console.error("Erro ao checar status:", e);
        }

        await sleep(1500);
      }
    }

    checar();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
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
        <span className="text-lg font-medium">{detalhe}</span>
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

        <p className="mt-4 text-xs text-gray-500">
          Status atual: <b>{status}</b>
        </p>
      </div>
    </main>
  );
}
