export const dynamic = "force-static";

import Link from "next/link";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function ResultadoEnfermagem() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">

      {/* Título */}
      <h1 className="text-3xl font-semibold text-emerald-700">
        Resultado da Avaliação
      </h1>
      <p className="text-gray-600 mt-1">
        Parecer final do farmacêutico sobre a prescrição
      </p>

      {/* BOX PRINCIPAL */}
      <div className="mt-8 bg-white border shadow-lg rounded-2xl p-8 max-w-3xl mx-auto">

        {/* STATUS FINAL */}
        <div className="mb-8 text-center">
          <XCircle className="w-14 h-14 text-red-600 mx-auto" />
          <h2 className="text-2xl font-bold text-red-700 mt-2">
            Risco Grave – Não Administrar
          </h2>
          <p className="text-gray-600 mt-1">
            Ajustes obrigatórios identificados pelo farmacêutico.
          </p>
        </div>

        {/* TABELA DE ITENS COM RESULTADO */}
        <h3 className="text-xl font-semibold text-emerald-700 mb-4">
          Situação dos Itens da Prescrição
        </h3>

        <table className="w-full border mb-8 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">Medicamento</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Observação</th>
            </tr>
          </thead>

          <tbody>
            {/* Exemplo 1 */}
            <tr>
              <td className="p-3 border">—</td>
              <td className="p-3 border text-red-600 font-semibold">
                <span className="flex items-center justify-center gap-2">
                  <XCircle className="w-5 h-5" /> Risco Grave
                </span>
              </td>
              <td className="p-3 border text-gray-700">Via incompatível</td>
            </tr>

            {/* Exemplo 2 */}
            <tr>
              <td className="p-3 border">—</td>
              <td className="p-3 border text-yellow-600 font-semibold">
                <span className="flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Atenção
                </span>
              </td>
              <td className="p-3 border text-gray-700">Ajustar dose conforme mg/kg</td>
            </tr>

            {/* Exemplo 3 */}
            <tr>
              <td className="p-3 border">—</td>
              <td className="p-3 border text-emerald-700 font-semibold">
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> OK
                </span>
              </td>
              <td className="p-3 border text-gray-700">Dentro dos padrões</td>
            </tr>
          </tbody>
        </table>

        {/* ORIENTAÇÕES PARA A ENFERMAGEM */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-emerald-700">
            Orientações para Enfermagem
          </h3>
          <p className="text-gray-700 mt-2">
            — Não administrar o medicamento marcado como RISCO GRAVE.<br />
            — Aguardar contato da farmácia clínica.<br />
            — Ajustar diluição e dose conforme instruções recebidas.<br />
          </p>
        </div>

        {/* BOTÃO VOLTAR */}
        <div className="text-center">
          <Link
            href="/avaliamedic"
            className="bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-800 transition shadow"
          >
            Voltar ao Dashboard
          </Link>
        </div>

      </div>
    </main>
  );
}
