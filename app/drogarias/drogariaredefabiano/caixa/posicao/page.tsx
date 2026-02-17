"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfDayISO(dateISO: string) {
  // dateISO = YYYY-MM-DD
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

  // descrições
  desc_sangrias?: string | null;
  desc_despesas?: string | null;
  desc_boletos?: string | null;
  desc_compras?: string | null;

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

  // ✅ fechamentos do dia (turnos)
  const [fechamentosDia, setFechamentosDia] = useState<Fechamento[]>([]);
  const [loadingFechDia, setLoadingFechDia] = useState(true);

  const ano = new Date().getFullYear();
  const inicioAno = `${ano}-01-01T00:00:00`;

  const hojeISO = useMemo(() => toISODate(new Date()), []);

  useEffect(() => {
    carregarPosicaoAno();
    carregarFechamentosDoDia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function carregarFechamentosDoDia() {
    setLoadingFechDia(true);

    // como você salva fechamento com "T12:00:00", esse range pega certinho o dia
    const { data, error } = await supabase
      .from("caixa_diario")
      .select("*")
      .eq("loja", LOJA)
      .gte("data", startOfDayISO(hojeISO))
      .lte("data", endOfDayISO(hojeISO))
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
          .page-break { break-before: page; page-break-before: always; }
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
              PDF único (posição + turnos do dia {formatDateBR(hojeISO)})
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
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
        {/* CAPA */}
        <div className="border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-blue-800">
            Drogaria Rede Fabiano
          </h2>
          <p className="text-sm text-gray-600">
            Relatório Único — Posição Financeira + Relatórios Diários (Turnos do Dia)
          </p>
          <p className="text-xs text-gray-500">
            Loja: {LOJA} • Ano: {ano} • Dia: {formatDateBR(hojeISO)} • Gerado em{" "}
            {new Date().toLocaleString("pt-BR")}
          </p>
        </div>

        {/* POSIÇÃO FINANCEIRA (ANO) */}
        {loading ? (
          <p>Carregando posição financeira…</p>
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

        {/* RESUMO DOS TURNOS DO DIA (TOTAL TURNO 1 / TURNO 2) */}
        <div className="mt-8 border rounded p-4 bg-slate-50">
          <h3 className="text-lg font-bold text-blue-800 mb-2">
            📆 Resumo do Dia — Turnos ({formatDateBR(hojeISO)})
          </h3>

          {loadingFechDia ? (
            <p>Carregando fechamentos do dia…</p>
          ) : resumoDia.turnos.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhum fechamento encontrado hoje.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resumoDia.turnos.map((t, idx) => (
                  <div key={t.id} className="bg-white border rounded p-3">
                    <p className="font-bold text-slate-800">
                      Turno {idx + 1} • {t.hora}
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
                  <p className="text-xl font-bold mt-2">
                    <span className={resumoDia.totalDia.saldo >= 0 ? "text-green-700" : "text-red-700"}>
                      R$ {fmt(resumoDia.totalDia.saldo)}
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RELATÓRIOS DIÁRIOS (IMPRIMIR TODOS FECHAMENTOS DO DIA) */}
        <div className="page-break mt-10">
          <div className="border-b pb-3 mb-4">
            <h3 className="text-xl font-bold text-blue-800">
              🧾 Relatórios Diários — Todos os Fechamentos do Dia
            </h3>
            <p className="text-xs text-gray-500">
              Fonte: tabela <span className="font-mono">caixa_diario</span> • Dia {formatDateBR(hojeISO)}
            </p>
          </div>

          {loadingFechDia ? (
            <p>Carregando…</p>
          ) : fechamentosDia.length === 0 ? (
            <p className="text-sm text-gray-600">Sem fechamentos hoje.</p>
          ) : (
            <div className="space-y-10">
              {fechamentosDia.map((f, idx) => {
                const entradasT = calcEntradasDia(f);
                const saidasT = calcSaidasDia(f);
                const saldoT = entradasT - saidasT;

                return (
                  <div key={f.id} className={idx > 0 ? "page-break" : ""}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-slate-800">
                          Fechamento / Turno {idx + 1} • {formatTimeBR(f.data)} • ID {f.id}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Data: {formatDateBR(String(f.data).slice(0, 10))} • Loja: {LOJA}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold">Total do turno</p>
                        <p className={`text-xl font-bold ${saldoT >= 0 ? "text-green-700" : "text-red-700"}`}>
                          R$ {fmt(saldoT)}
                        </p>
                      </div>
                    </div>

                    {/* Cards principais */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div className="border rounded p-3">
                        <p className="text-xs text-gray-500">Venda Total</p>
                        <p className="font-bold">R$ {fmt(f.venda_total || 0)}</p>
                      </div>

                      <div className="border rounded p-3">
                        <p className="text-xs text-gray-500">Entradas</p>
                        <p className="font-bold text-green-700">R$ {fmt(entradasT)}</p>
                      </div>

                      <div className="border rounded p-3">
                        <p className="text-xs text-gray-500">Saídas</p>
                        <p className="font-bold text-red-700">R$ {fmt(saidasT)}</p>
                      </div>

                      <div className="border rounded p-3">
                        <p className="text-xs text-gray-500">Saldo do Dia</p>
                        <p className={`font-bold ${saldoT >= 0 ? "text-green-700" : "text-red-700"}`}>
                          R$ {fmt(saldoT)}
                        </p>
                      </div>
                    </div>

                    {/* Entradas detalhadas */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded p-3">
                        <p className="font-bold text-green-700 mb-1">Entradas</p>
                        <p className="text-sm">Dinheiro: R$ {fmt(f.dinheiro || 0)}</p>
                        <p className="text-sm">Pix CNPJ: R$ {fmt(f.pix_cnpj || 0)}</p>
                        <p className="text-sm">Pix QR: R$ {fmt(f.pix_qr || 0)}</p>
                        <p className="text-sm">Cartões: R$ {fmt(f.cartoes || 0)}</p>
                        <p className="text-sm">Receb. Fiado: R$ {fmt(f.receb_fiado || 0)}</p>
                        <p className="text-sm text-orange-700">
                          Venda Fiado (registro): R$ {fmt(f.venda_fiado || 0)}
                        </p>
                      </div>

                      {/* Saídas detalhadas */}
                      <div className="border rounded p-3">
                        <p className="font-bold text-red-700 mb-1">Saídas</p>

                        <p className="text-sm">
                          Sangrias: R$ {fmt(f.sangrias || 0)}
                          {f.desc_sangrias ? <span className="text-xs text-gray-500"> • {f.desc_sangrias}</span> : null}
                        </p>

                        <p className="text-sm">
                          Despesas: R$ {fmt(f.despesas || 0)}
                          {f.desc_despesas ? <span className="text-xs text-gray-500"> • {f.desc_despesas}</span> : null}
                        </p>

                        <p className="text-sm">
                          Boletos: R$ {fmt(f.boletos || 0)}
                          {f.desc_boletos ? <span className="text-xs text-gray-500"> • {f.desc_boletos}</span> : null}
                        </p>

                        <p className="text-sm">
                          Compras: R$ {fmt(f.compras || 0)}
                          {f.desc_compras ? <span className="text-xs text-gray-500"> • {f.desc_compras}</span> : null}
                        </p>
                      </div>

                      {/* Opcional: embed que você já usa */}
                      <div className="border rounded p-3">
                        <p className="font-bold text-blue-700 mb-2">Embed (opcional)</p>
                        <p className="text-xs text-gray-500 mb-2">
                          Se esse componente já mostra o fechamento escolhido, ele também entra no PDF.
                        </p>
                        <RelatorioDiarioCaixaEmbed />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* (Opcional) relatório completo */}
        <div className="page-break mt-10">
          <div className="border-b pb-3 mb-4">
            <h3 className="text-xl font-bold text-blue-800">📄 Relatório Diário Completo (Opcional)</h3>
            <p className="text-xs text-gray-500">
              Se você quiser que saia também no PDF, ele fica aqui.
            </p>
          </div>
          <RelatorioDiarioCompleto />
        </div>

        <div className="mt-10 text-right text-sm">
          <p className="font-semibold">Fernando dos Santos Pereira</p>
          <p className="text-gray-500">Responsável</p>
        </div>
      </div>
    </main>
  );
}
