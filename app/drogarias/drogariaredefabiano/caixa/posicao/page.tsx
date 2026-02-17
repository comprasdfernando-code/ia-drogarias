"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

// ================= SUPABASE =================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LOJA = "drogariaredefabiano";

function fmt(n: number) {
  return Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfDayISO(dateISO: string) {
  return `${dateISO}T00:00:00`;
}
function endOfDayISO(dateISO: string) {
  return `${dateISO}T23:59:59`;
}

function formatDateBR(value: any) {
  if (!value) return "—";
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(s + "T12:00:00").toLocaleDateString("pt-BR");
  }
  return new Date(s).toLocaleDateString("pt-BR");
}

function formatTimeBR(value: any) {
  if (!value) return "—";
  const d = new Date(value);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

type Fechamento = {
  id: any;
  loja: string;
  data: string;

  venda_total: number;

  // fiado
  venda_fiado?: number | null;
  receb_fiado?: number | null;

  // entradas
  dinheiro?: number | null;
  pix_cnpj?: number | null;
  pix_qr?: number | null;
  cartoes?: number | null;

  // saídas
  sangrias?: number | null;
  despesas?: number | null;
  boletos?: number | null;
  compras?: number | null;

  saldo_dia?: number | null;
};

function calcEntradasDia(f: Fechamento) {
  return (
    Number(f.dinheiro || 0) +
    Number(f.pix_cnpj || 0) +
    Number(f.pix_qr || 0) +
    Number(f.cartoes || 0) +
    Number(f.receb_fiado || 0)
  );
}

function calcSaidasDia(f: Fechamento) {
  return (
    Number(f.sangrias || 0) +
    Number(f.despesas || 0) +
    Number(f.boletos || 0) +
    Number(f.compras || 0)
  );
}

export default function PosicaoFinanceiraPage() {
  const [entradas, setEntradas] = useState<any[]>([]);
  const [saidas, setSaidas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ data selecionada (turnos)
  const hoje = useMemo(() => toISODate(new Date()), []);
  const [dataSelecionada, setDataSelecionada] = useState<string>(hoje);

  // ✅ fechamentos do dia (turnos)
  const [fechamentosDia, setFechamentosDia] = useState<Fechamento[]>([]);
  const [loadingFechDia, setLoadingFechDia] = useState(true);

  const ano = new Date().getFullYear();
  const inicioAno = `${ano}-01-01T00:00:00`;

  useEffect(() => {
    carregarPosicaoAno();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    carregarFechamentosDoDia(dataSelecionada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSelecionada]);

  async function carregarPosicaoAno() {
    setLoading(true);

    const { data, error } = await supabase
      .from("movimentacoes_caixa")
      .select("*")
      .eq("loja", LOJA)
      .gte("data", inicioAno);

    if (error) console.error(error);

    setEntradas(data?.filter((m) => m.tipo === "Entrada") || []);
    setSaidas(data?.filter((m) => m.tipo === "Saída") || []);
    setLoading(false);
  }

  async function carregarFechamentosDoDia(dateISO: string) {
    setLoadingFechDia(true);

    const { data, error } = await supabase
      .from("caixa_diario")
      .select("*")
      .eq("loja", LOJA)
      .gte("data", startOfDayISO(dateISO))
      .lte("data", endOfDayISO(dateISO))
      .order("data", { ascending: true });

    if (error) console.error(error);

    setFechamentosDia((data || []) as any);
    setLoadingFechDia(false);
  }

  // ================= CÁLCULOS POSIÇÃO (ANO) =================
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

  // ================= RESUMO DO DIA (TURNOS) =================
  const resumoDia = useMemo(() => {
    const turnos = fechamentosDia.map((f) => {
      const entradasT = calcEntradasDia(f);
      const saidasT = calcSaidasDia(f);
      const saldoT = entradasT - saidasT;

      return {
        id: f.id,
        hora: formatTimeBR(f.data),
        venda: Number(f.venda_total || 0),
        entradas: entradasT,
        saidas: saidasT,
        saldo: saldoT,
      };
    });

    const totalDia = {
      venda: turnos.reduce((t, x) => t + x.venda, 0),
      entradas: turnos.reduce((t, x) => t + x.entradas, 0),
      saidas: turnos.reduce((t, x) => t + x.saidas, 0),
      saldo: turnos.reduce((t, x) => t + x.saldo, 0),
    };

    return { turnos, totalDia };
  }, [fechamentosDia]);

  function gerarPDF() {
    window.print();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      {/* ===== CSS PDF ===== */}
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; }
          a { color: black !important; text-decoration: none !important; }
        }
      `}</style>

      {/* ===== CABEÇALHO / CONTROLES ===== */}
      <div className="no-print max-w-5xl mx-auto bg-white rounded shadow p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">
              📊 Posição Financeira — {ano}
            </h1>
            <p className="text-sm text-gray-600">
              PDF único (posição + turnos do dia selecionado)
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-sm text-gray-600">
              Data:&nbsp;
              <input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                className="border p-2 rounded"
              />
            </label>

            <Link
              href="/drogarias/drogariaredefabiano/caixa"
              className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded font-semibold"
            >
              ⬅️ Voltar Caixa
            </Link>

            <button
              onClick={gerarPDF}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
            >
              🖨️ Gerar PDF Único
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Dica: no print, selecione “Salvar como PDF”.
        </p>
      </div>

      {/* ===== ÁREA DE IMPRESSÃO ===== */}
      <div className="print-area max-w-5xl mx-auto bg-white rounded shadow p-6">
        {/* CAPA / RESUMO */}
        <div className="border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-blue-800">
            Drogaria Rede Fabiano
          </h2>
          <p className="text-sm text-gray-600">
            Relatório Único — Posição Financeira + Turnos do Dia
          </p>
          <p className="text-xs text-gray-500">
            Loja: {LOJA} • Ano: {ano} • Dia: {formatDateBR(dataSelecionada)} • Gerado em{" "}
            {new Date().toLocaleString("pt-BR")}
          </p>
        </div>

        {/* POSIÇÃO FINANCEIRA (ANO) */}
        {loading ? (
          <p>Carregando dados…</p>
        ) : (
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3">
              📌 Posição Financeira (Acumulado do ano)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded p-4">
                <h4 className="font-bold text-green-700 mb-2">💵 Caixa Dinheiro</h4>
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
                <h4 className="font-bold text-blue-700 mb-2">🏦 Conta Bancária</h4>
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
                <h4 className="font-bold text-gray-700 mb-2">💰 Saldo Geral</h4>
                <p className={`text-2xl font-bold ${saldoGeral >= 0 ? "text-green-700" : "text-red-700"}`}>
                  R$ {fmt(saldoGeral)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* RESUMO DO DIA — TURNOS */}
        <div className="mt-8 border rounded p-4 bg-slate-50">
          <h3 className="text-lg font-bold text-blue-800 mb-2">
            📆 Resumo do Dia — Turnos ({formatDateBR(dataSelecionada)})
          </h3>

          {loadingFechDia ? (
            <p>Carregando fechamentos do dia…</p>
          ) : resumoDia.turnos.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhum fechamento encontrado na data selecionada.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {resumoDia.turnos.map((t, idx) => (
                <div key={t.id} className="bg-white border rounded p-3">
                  <p className="font-bold text-slate-800">
                    Turno {idx + 1} • {t.hora} • ID {t.id}
                  </p>
                  <p className="text-sm">Venda: R$ {fmt(t.venda)}</p>
                  <p className="text-sm text-green-700">Entradas: R$ {fmt(t.entradas)}</p>
                  <p className="text-sm text-red-700">Saídas: R$ {fmt(t.saidas)}</p>
                  <p className="border-t mt-2 pt-2 font-bold">
                    Total do turno:{" "}
                    <span className={t.saldo >= 0 ? "text-green-700" : "text-red-700"}>
                      R$ {fmt(t.saldo)}
                    </span>
                  </p>
                </div>
              ))}

              <div className="bg-white border rounded p-3 text-center">
                <p className="font-bold text-slate-800">Total do Dia</p>
                <p className="text-sm">Venda: R$ {fmt(resumoDia.totalDia.venda)}</p>
                <p className="text-sm text-green-700">Entradas: R$ {fmt(resumoDia.totalDia.entradas)}</p>
                <p className="text-sm text-red-700">Saídas: R$ {fmt(resumoDia.totalDia.saidas)}</p>
                <p className={`text-2xl font-bold mt-2 ${resumoDia.totalDia.saldo >= 0 ? "text-green-700" : "text-red-700"}`}>
                  R$ {fmt(resumoDia.totalDia.saldo)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ASSINATURA */}
        <div className="mt-10 text-right text-sm">
          <p className="font-semibold">Fernando dos Santos Pereira</p>
          <p className="text-gray-500">Responsável</p>
        </div>
      </div>
    </main>
  );
}
