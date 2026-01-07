"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import RelatorioDiarioCompleto from "../components/RelatorioDiarioCompleto";
import RelatorioDiarioCaixaEmbed from "../components/RelatorioDiarioCaixaEmbed";



// ================= SUPABASE =================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LOJA = "drogariaredefabiano";

function fmt(n: number) {
  return Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

export default function PosicaoFinanceiraPage() {
  const [entradas, setEntradas] = useState<any[]>([]);
  const [saidas, setSaidas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const ano = new Date().getFullYear();
  const inicioAno = `${ano}-01-01T00:00:00`;

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);

    const { data } = await supabase
      .from("movimentacoes_caixa")
      .select("*")
      .eq("loja", LOJA)
      .gte("data", inicioAno);

    setEntradas(data?.filter((m) => m.tipo === "Entrada") || []);
    setSaidas(data?.filter((m) => m.tipo === "Saída") || []);
    setLoading(false);
  }

  // ================= CÁLCULOS =================
  const entradasDinheiro = entradas
    .filter((e) => e.forma_pagamento === "Dinheiro")
    .reduce((t, e) => t + e.valor, 0);

  const saidasDinheiro = saidas
    .filter((s) => s.destino_financeiro === "CAIXA_DINHEIRO")
    .reduce((t, s) => t + s.valor, 0);

  const saldoDinheiro = entradasDinheiro - saidasDinheiro;

  const entradasBanco = entradas
    .filter((e) => e.destino_financeiro === "CONTA_BRADESCO")
    .reduce((t, e) => t + e.valor, 0);

  const saidasBanco = saidas
    .filter((s) => s.destino_financeiro === "CONTA_BRADESCO")
    .reduce((t, s) => t + s.valor, 0);

  const saldoBanco = entradasBanco - saidasBanco;

  const saldoGeral = saldoDinheiro + saldoBanco;

  function gerarPDF() {
    window.print();
  }

  // ================= INTERFACE =================
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      {/* ===== CSS PDF ===== */}
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* ===== CABEÇALHO / CONTROLES ===== */}
      <div className="no-print max-w-4xl mx-auto bg-white rounded shadow p-4 mb-6">
        <h1 className="text-2xl font-bold text-blue-700">
          📊 Posição Financeira — {ano}
        </h1>
        <p className="text-sm text-gray-600 mb-3">
          Contagem iniciada em 01/01/{ano}
        </p>

        <button
          onClick={gerarPDF}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
        >
          🖨️ Gerar PDF
        </button>
      </div>

      {/* ===== ÁREA DE IMPRESSÃO ===== */}
      <div className="print-area max-w-4xl mx-auto bg-white rounded shadow p-6">
        <div className="border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-blue-800">
            Drogaria Rede Fabiano
          </h2>
          <p className="text-sm text-gray-600">
            Relatório de Posição Financeira — {ano}
          </p>
          <p className="text-xs text-gray-500">
            Loja: {LOJA} • Gerado em{" "}
            {new Date().toLocaleString("pt-BR")}
          </p>
        </div>

        {loading ? (
          <p>Carregando dados…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded p-4">
              <h3 className="font-bold text-green-700 mb-2">💵 Caixa Dinheiro</h3>
              <p>Entradas: R$ {fmt(entradasDinheiro)}</p>
              <p>Saídas: R$ {fmt(saidasDinheiro)}</p>
              <p className="border-t mt-2 pt-2 font-bold">
                Saldo:{" "}
                <span className={saldoDinheiro >= 0 ? "text-green-700" : "text-red-700"}>
                  R$ {fmt(saldoDinheiro)}
                </span>
              </p>
            </div>

            <div className="border rounded p-4">
              <h3 className="font-bold text-blue-700 mb-2">🏦 Conta Bancária</h3>
              <p>Entradas: R$ {fmt(entradasBanco)}</p>
              <p>Saídas: R$ {fmt(saidasBanco)}</p>
              <p className="border-t mt-2 pt-2 font-bold">
                Saldo:{" "}
                <span className={saldoBanco >= 0 ? "text-green-700" : "text-red-700"}>
                  R$ {fmt(saldoBanco)}
                </span>
              </p>
            </div>

            <div className="border rounded p-4 text-center">
              <h3 className="font-bold text-gray-700 mb-2">💰 Saldo Geral</h3>
              <p className={`text-2xl font-bold ${saldoGeral >= 0 ? "text-green-700" : "text-red-700"}`}>
                R$ {fmt(saldoGeral)}
              </p>
            </div>
          </div>
        )}

        // ...dentro do JSX
<RelatorioDiarioCaixaEmbed />



        <div className="mt-10 text-right text-sm">
          <p className="font-semibold">Fernando dos Santos Pereira</p>
          <p className="text-gray-500">Responsável</p>
        </div>
      </div>
    </main>
  );
}
