"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);

    const inicioAno = `${new Date().getFullYear()}-01-01T00:00:00`;

    const { data } = await supabase
      .from("movimentacoes_caixa")
      .select("*")
      .eq("loja", LOJA)
      .gte("data", inicioAno);

    setEntradas(data?.filter((m) => m.tipo === "Entrada") || []);
    setSaidas(data?.filter((m) => m.tipo === "Saída") || []);
    setLoading(false);
  }

  // ===== CÁLCULOS =====
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

  if (loading) {
    return <p className="p-6">Carregando posição financeira…</p>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">
        📊 Posição Financeira — {new Date().getFullYear()}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
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

        <div className="bg-white rounded-lg shadow p-4">
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

        <div className="bg-white rounded-lg shadow p-4 text-center">
          <h3 className="font-bold text-gray-700 mb-2">💰 Saldo Geral</h3>
          <p className={`text-2xl font-bold ${saldoGeral >= 0 ? "text-green-700" : "text-red-700"}`}>
            R$ {fmt(saldoGeral)}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-6 text-center">
        Contagem iniciada em 01/01/{new Date().getFullYear()}
      </p>
    </main>
  );
}
