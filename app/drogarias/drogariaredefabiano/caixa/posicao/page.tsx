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

function startOfDayISO(d: Date) {
  return `${toISODate(d)}T00:00:00`;
}

function endOfDayISO(d: Date) {
  return `${toISODate(d)}T23:59:59`;
}

// ✅ evita shift de 1 dia quando vier "YYYY-MM-DD"
function formatDateBR(value: any) {
  if (!value) return "—";
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(s + "T12:00:00").toLocaleDateString("pt-BR");
  }
  return new Date(s).toLocaleDateString("pt-BR");
}

function formatDateTimeBR(value: any) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function getCaixaKey(m: any) {
  // tenta achar algum identificador de “caixa” se existir na tabela
  return (
    m?.caixa ||
    m?.caixa_id ||
    m?.pdv ||
    m?.pdv_id ||
    m?.terminal ||
    m?.terminal_id ||
    m?.operador ||
    m?.user_id ||
    "CAIXA"
  );
}

export default function PosicaoFinanceiraPage() {
  const [entradas, setEntradas] = useState<any[]>([]);
  const [saidas, setSaidas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ dados do dia (para “Relatórios diários de todos os caixas”)
  const [movsDia, setMovsDia] = useState<any[]>([]);
  const [loadingDia, setLoadingDia] = useState(true);

  const ano = new Date().getFullYear();
  const inicioAno = `${ano}-01-01T00:00:00`;

  const hoje = useMemo(() => new Date(), []);
  const hojeIni = useMemo(() => startOfDayISO(new Date()), []);
  const hojeFim = useMemo(() => endOfDayISO(new Date()), []);

  useEffect(() => {
    carregar();
    carregarDia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregar() {
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

  async function carregarDia() {
    setLoadingDia(true);

    const { data, error } = await supabase
      .from("movimentacoes_caixa")
      .select("*")
      .eq("loja", LOJA)
      .gte("data", hojeIni)
      .lte("data", hojeFim)
      .order("data", { ascending: true });

    if (error) console.error(error);

    setMovsDia(data || []);
    setLoadingDia(false);
  }

  // ================= CÁLCULOS (GERAL ANO) =================
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

  // ================= AGRUPAR MOVIMENTAÇÕES DO DIA POR CAIXA =================
  const caixasDoDia = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const m of movsDia) {
      const key = String(getCaixaKey(m));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries()).map(([caixaKey, items]) => {
      const ents = items.filter((i) => i.tipo === "Entrada");
      const sds = items.filter((i) => i.tipo === "Saída");

      const entradasTotal = ents.reduce((t, i) => t + Number(i.valor || 0), 0);
      const saidasTotal = sds.reduce((t, i) => t + Number(i.valor || 0), 0);

      const entradasDin = ents
        .filter((i) => i.forma_pagamento === "Dinheiro")
        .reduce((t, i) => t + Number(i.valor || 0), 0);

      const saidasDin = sds
        .filter((i) => i.destino_financeiro === "CAIXA_DINHEIRO")
        .reduce((t, i) => t + Number(i.valor || 0), 0);

      const entradasBco = ents
        .filter((i) => i.destino_financeiro === "CONTA_BRADESCO")
        .reduce((t, i) => t + Number(i.valor || 0), 0);

      const saidasBco = sds
        .filter((i) => i.destino_financeiro === "CONTA_BRADESCO")
        .reduce((t, i) => t + Number(i.valor || 0), 0);

      return {
        caixaKey,
        itens: items,
        entradasTotal,
        saidasTotal,
        saldo: entradasTotal - saidasTotal,
        saldoDinheiro: entradasDin - saidasDin,
        saldoBanco: entradasBco - saidasBco,
      };
    });
  }, [movsDia]);

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
          .page-break { break-before: page; page-break-before: always; }
          a { color: black !important; text-decoration: none !important; }
        }
      `}</style>

      {/* ===== CABEÇALHO / CONTROLES ===== */}
      <div className="no-print max-w-5xl mx-auto bg-white rounded shadow p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">📊 Posição Financeira — {ano}</h1>
            <p className="text-sm text-gray-600">
              Contagem iniciada em 01/01/{ano} • Relatório diário: {formatDateBR(toISODate(new Date()))}
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
          Dica: no print, selecione “Salvar como PDF” para gerar o arquivo.
        </p>
      </div>

      {/* ===== ÁREA DE IMPRESSÃO ===== */}
      <div className="print-area max-w-5xl mx-auto bg-white rounded shadow p-6">
        {/* CAPA / RESUMO */}
        <div className="border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-blue-800">Drogaria Rede Fabiano</h2>
          <p className="text-sm text-gray-600">Relatório Único — Posição Financeira + Relatórios Diários (Todos os Caixas)</p>
          <p className="text-xs text-gray-500">
            Loja: {LOJA} • Ano: {ano} • Dia: {formatDateBR(toISODate(hoje))} • Gerado em {new Date().toLocaleString("pt-BR")}
          </p>
        </div>

        {/* POSIÇÃO FINANCEIRA (ANO) */}
        {loading ? (
          <p>Carregando posição financeira…</p>
        ) : (
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3">📌 Posição Financeira (Acumulado do ano)</h3>

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

        {/* ===== RELATÓRIOS DIÁRIOS (TODOS OS CAIXAS DO DIA) ===== */}
        <div className="page-break mt-10">
          <div className="border-b pb-3 mb-4">
            <h3 className="text-xl font-bold text-blue-800">🧾 Relatórios Diários — Todos os Caixas (Dia {formatDateBR(toISODate(new Date()))})</h3>
            <p className="text-xs text-gray-500">
              Baseado em movimentações do dia na tabela <span className="font-mono">movimentacoes_caixa</span>.
            </p>
          </div>

          {loadingDia ? (
            <p>Carregando movimentações do dia…</p>
          ) : caixasDoDia.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhuma movimentação encontrada para hoje.</p>
          ) : (
            <div className="space-y-8">
              {caixasDoDia.map((cx, idx) => (
                <div key={cx.caixaKey} className={idx > 0 ? "page-break" : ""}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">
                        🧾 Caixa: <span className="font-mono">{cx.caixaKey}</span>
                      </h4>
                      <p className="text-xs text-gray-500">
                        Itens: {cx.itens.length} • Entradas: R$ {fmt(cx.entradasTotal)} • Saídas: R$ {fmt(cx.saidasTotal)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold">Saldo do dia</p>
                      <p className={`text-xl font-bold ${cx.saldo >= 0 ? "text-green-700" : "text-red-700"}`}>
                        R$ {fmt(cx.saldo)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="border rounded p-3">
                      <p className="font-bold text-green-700">💵 Caixa Dinheiro</p>
                      <p className="text-sm">
                        Saldo:{" "}
                        <span className={cx.saldoDinheiro >= 0 ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                          R$ {fmt(cx.saldoDinheiro)}
                        </span>
                      </p>
                    </div>

                    <div className="border rounded p-3">
                      <p className="font-bold text-blue-700">🏦 Conta Bancária</p>
                      <p className="text-sm">
                        Saldo:{" "}
                        <span className={cx.saldoBanco >= 0 ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                          R$ {fmt(cx.saldoBanco)}
                        </span>
                      </p>
                    </div>

                    <div className="border rounded p-3">
                      <p className="font-bold text-gray-700">📌 Resumo</p>
                      <p className="text-sm">Entradas: R$ {fmt(cx.entradasTotal)}</p>
                      <p className="text-sm">Saídas: R$ {fmt(cx.saidasTotal)}</p>
                    </div>
                  </div>

                  {/* TABELA DETALHADA DO DIA (para ficar “fechado” no PDF mesmo sem componentes) */}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs border">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="p-2 border">Hora</th>
                          <th className="p-2 border">Tipo</th>
                          <th className="p-2 border">Descrição</th>
                          <th className="p-2 border">Forma</th>
                          <th className="p-2 border">Destino</th>
                          <th className="p-2 border text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cx.itens.map((m: any) => (
                          <tr key={m.id} className="hover:bg-gray-50">
                            <td className="p-2 border text-center">{formatDateTimeBR(m.data).slice(11, 19)}</td>
                            <td className={`p-2 border text-center font-semibold ${m.tipo === "Entrada" ? "text-green-700" : "text-red-700"}`}>
                              {m.tipo}
                            </td>
                            <td className="p-2 border">{m.descricao || "—"}</td>
                            <td className="p-2 border text-center">{m.forma_pagamento || "—"}</td>
                            <td className="p-2 border text-center">{m.destino_financeiro || "—"}</td>
                            <td className="p-2 border text-right">R$ {fmt(m.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Se seus componentes já imprimem bonitinho, deixo também (não atrapalha) */}
                  <div className="mt-6">
                    <RelatorioDiarioCaixaEmbed />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RELATÓRIO DIÁRIO COMPLETO (se existir e você quiser incluir) */}
        <div className="page-break mt-10">
          <div className="border-b pb-3 mb-4">
            <h3 className="text-xl font-bold text-blue-800">📄 Relatório Diário Completo (Embed)</h3>
            <p className="text-xs text-gray-500">Se este componente já consolida tudo, ele sai no mesmo PDF também.</p>
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
