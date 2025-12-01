"use client";



import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export const dynamic = "force-static";

export default function RelatorioAvaliacao() {
  const params = useSearchParams();
  const router = useRouter();

  const prescricao_id = params.get("prescricao_id");

  const [prescricao, setPrescricao] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar dados reais no Supabase API
  useEffect(() => {
    async function carregar() {
      if (!prescricao_id) return;

      // 1. buscar prescrição
      const prescRes = await fetch(`/avaliamedic/api/get-prescricao?prescricao_id=${prescricao_id}`);
      const prescJson = await prescRes.json();

      // 2. buscar itens
      const itensRes = await fetch(`/avaliamedic/api/get-itens?prescricao_id=${prescricao_id}`);
      const itensJson = await itensRes.json();

      // 3. buscar análise
      const analiseRes = await fetch(`/avaliamedic/api/get-analise?prescricao_id=${prescricao_id}`);
      const analiseJson = await analiseRes.json();

      setPrescricao(prescJson);
      setItens(itensJson);
      setAlertas(analiseJson.alertas || []);

      setLoading(false);
    }

    carregar();
  }, [prescricao_id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-emerald-700 font-medium text-xl">Carregando relatório...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">

      {/* Título */}
      <h1 className="text-3xl font-semibold text-emerald-700">
        Relatório de Avaliação
      </h1>
      <p className="text-gray-600 mt-1">
        Resultado da análise inteligente da prescrição
      </p>

      {/* Dados do paciente */}
      <section className="mt-8 bg-white p-6 border rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold text-emerald-700">Dados do Paciente</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-gray-700">
          <p><strong>Idade:</strong> {prescricao?.idade}</p>
          <p><strong>Peso:</strong> {prescricao?.peso} kg</p>
          <p><strong>Setor:</strong> {prescricao?.setor}</p>
        </div>
      </section>

      {/* Itens analisados */}
      <section className="mt-8 bg-white p-6 border rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold text-emerald-700">Itens da Prescrição</h2>

        <table className="w-full mt-6 border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">Medicamento</th>
              <th className="p-3 border">Dose</th>
              <th className="p-3 border">Via</th>
              <th className="p-3 border">Frequência</th>
              <th className="p-3 border">Status</th>
            </tr>
          </thead>

          <tbody>
            {itens.map((item, index) => (
              <tr key={index}>
                <td className="p-3 border">{item.medicamento}</td>
                <td className="p-3 border">{item.dose}</td>
                <td className="p-3 border">{item.via}</td>
                <td className="p-3 border">{item.frequencia}</td>
                <td className="p-3 border text-center font-semibold">

                  {item.risco === "ok" && (
                    <span className="flex justify-center items-center gap-2 text-emerald-700">
                      <CheckCircle className="w-5 h-5" /> OK
                    </span>
                  )}

                  {item.risco === "atencao" && (
                    <span className="flex justify-center items-center gap-2 text-yellow-600">
                      <AlertTriangle className="w-5 h-5" /> Atenção
                    </span>
                  )}

                  {item.risco === "risco_alto" && (
                    <span className="flex justify-center items-center gap-2 text-orange-600">
                      <AlertTriangle className="w-5 h-5" /> Risco Alto
                    </span>
                  )}

                  {item.risco === "risco_grave" && (
                    <span className="flex justify-center items-center gap-2 text-red-600">
                      <XCircle className="w-5 h-5" /> Risco Grave
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Alertas */}
      <section className="mt-8 bg-white p-6 border rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold text-emerald-700">Alertas da IA</h2>

        {alertas.length === 0 ? (
          <p className="text-gray-600 mt-4">Nenhum alerta encontrado.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-gray-700 text-sm">
            {alertas.map((alerta, index) => (
              <li key={index} className="flex gap-2">
                <AlertTriangle className="text-red-600 w-5 h-5" />
                <span>{alerta}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Botão para parecer */}
      <div className="mt-10 flex justify-end">
        <Link
          href={`/avaliamedic/parecer?prescricao_id=${prescricao_id}`}
          className="bg-emerald-700 text-white px-6 py-3 rounded-lg shadow hover:bg-emerald-800 transition"
        >
          Registrar Parecer Farmacêutico
        </Link>
      </div>
    </main>
  );
}
