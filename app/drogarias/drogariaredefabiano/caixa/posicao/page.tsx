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

// ================= HELPERS =================
function fmt(n: number) {
  return Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// ✅ Brasil (-03:00) => converte o dia local para ISO UTC certo (timestamptz)
function startOfDayTZ(dateISO: string) {
  return new Date(`${dateISO}T00:00:00-03:00`).toISOString();
}
function endOfDayTZ(dateISO: string) {
  return new Date(`${dateISO}T23:59:59-03:00`).toISOString();
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

// ================= TYPES =================
type Fechamento = {
  id: any;
  loja: string;

  // timestamp do fechamento (pode ser timestamptz)
  data: string;

  // se existir, é melhor ainda
  created_at?: string | null;

  venda_total: number;

  // fiado
  venda_fiado?: number | null;
  receb_fiado?: number | null;

  // entradas
  dinheiro?: number | null;
  pix_cnpj?: number | null;
  pix_qr?: number | null;
  cartoes?: number | null;

  // saídas (resumo)
  sangrias?: number | null;
  despesas?: number | null;
  boletos?: number | null;
  compras?: number | null;

  saldo_dia?: number | null;
};

type MovCaixa = {
  id: number;
  tipo: string;
  descricao: string;
  valor: number;
  forma_pagamento?: string | null;
  destino_financeiro?: string | null;
  data?: string | null; // date
  created_at?: string | null; // timestamptz
  loja: string;
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

function fechamentoTimestamp(f: Fechamento) {
  const v = f.created_at || f.data;
  return new Date(v).getTime();
}

export default function PosicaoFinanceiraPage() {
  const [entradas, setEntradas] = useState<MovCaixa[]>([]);
  const [saidas, setSaidas] = useState<MovCaixa[]>([]);
  const [loading, setLoading] = useState(true);

  const hoje = useMemo(() => toISODate(new Date()), []);
  const [dataSelecionada, setDataSelecionada] = useState<string>(hoje);

  const [fechamentosDia, setFechamentosDia] = useState<Fechamento[]>([]);
  const [loadingFechDia, setLoadingFechDia] = useState(true);

  const [saidasPorTurno, setSaidasPorTurno] = useState<Record<string, MovCaixa[]>>(
    {}
  );

  // ✅ saídas que ficaram AFTER do último fechamento (se quiser mostrar)
  const [saidasAposUltimoFech, setSaidasAposUltimoFech] = useState<MovCaixa[]>([]);
  const [loadingSaidasTurno, setLoadingSaidasTurno] = useState(false);

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

  useEffect(() => {
    if (!loadingFechDia) {
      carregarSaidasDetalhadasPorTurno(dataSelecionada, fechamentosDia);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingFechDia, fechamentosDia, dataSelecionada]);

  async function carregarPosicaoAno() {
    setLoading(true);

    const { data, error } = await supabase
      .from("movimentacoes_caixa")
      .select("*")
      .eq("loja", LOJA)
      .gte("data", inicioAno);

    if (error) console.error(error);

    const rows = (data || []) as MovCaixa[];
    setEntradas(rows.filter((m) => m.tipo === "Entrada"));
    setSaidas(rows.filter((m) => m.tipo === "Saída"));
    setLoading(false);
  }

  async function carregarFechamentosDoDia(dateISO: string) {
    setLoadingFechDia(true);

    // ✅ puxa fechamentos do dia (usando TZ)
    const { data, error } = await supabase
      .from("caixa_diario")
      .select("*") // inclui created_at se existir
      .eq("loja", LOJA)
      .gte("data", startOfDayTZ(dateISO))
      .lte("data", endOfDayTZ(dateISO))
      .order("data", { ascending: true });

    if (error) console.error(error);

    setFechamentosDia((data || []) as any);
    setLoadingFechDia(false);
  }

  // ✅ puxa TODAS as saídas do DIA pelo created_at (TZ certo)
  // e distribui SOMENTE dentro da janela do turno:
  // turno i: (prevFech, fechAtual]
  // saídas > último fechamento vão para saidasAposUltimoFech (bloco separado)
  async function carregarSaidasDetalhadasPorTurno(dateISO: string, fechs: Fechamento[]) {
    setLoadingSaidasTurno(true);
    setSaidasAposUltimoFech([]);

    try {
      if (!fechs || fechs.length === 0) {
        setSaidasPorTurno({});
        return;
      }

      const diaStartISO = startOfDayTZ(dateISO);
      const diaEndISO = endOfDayTZ(dateISO);
      const diaStartTs = new Date(diaStartISO).getTime();
      const diaEndTs = new Date(diaEndISO).getTime();

      // 1) saídas do dia (por created_at, com TZ)
      const { data: saidasDia, error } = await supabase
        .from("movimentacoes_caixa")
        .select("id,tipo,descricao,valor,forma_pagamento,destino_financeiro,data,created_at,loja")
        .eq("loja", LOJA)
        .eq("tipo", "Saída")
        .gte("created_at", diaStartISO)
        .lte("created_at", diaEndISO)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro saídas do dia:", error);
        setSaidasPorTurno({});
        return;
      }

      const saidasList = (saidasDia || []) as MovCaixa[];

      // 2) fechamentos ordenados
      const fechOrdenado = [...fechs].sort((a, b) => fechamentoTimestamp(a) - fechamentoTimestamp(b));

      // 3) prepara mapa por turno
      const map: Record<string, MovCaixa[]> = {};
      fechOrdenado.forEach((f) => (map[String(f.id)] = []));

      const ultimoFechTs = fechamentoTimestamp(fechOrdenado[fechOrdenado.length - 1]);

      // 4) bucket certo: (prev, atual]
      for (const s of saidasList) {
        const tsSaida = s.created_at ? new Date(s.created_at).getTime() : diaStartTs;

        // trava extra (segurança)
        if (tsSaida < diaStartTs || tsSaida > diaEndTs) continue;

        // se é depois do último fechamento, joga no bloco separado
        if (tsSaida > ultimoFechTs) {
          setSaidasAposUltimoFech((prev) => [...prev, s]);
          continue;
        }

        // acha o primeiro fechamento que "fecha" essa saída
        for (let i = 0; i < fechOrdenado.length; i++) {
          const atualTs = fechamentoTimestamp(fechOrdenado[i]);
          const prevTs = i === 0 ? diaStartTs : fechamentoTimestamp(fechOrdenado[i - 1]);

          if (tsSaida > prevTs && tsSaida <= atualTs) {
            map[String(fechOrdenado[i].id)].push(s);
            break;
          }
        }
      }

      setSaidasPorTurno(map);
    } finally {
      setLoadingSaidasTurno(false);
    }
  }

  // ================= CÁLCULOS POSIÇÃO (ANO) =================
  const entradasDinheiro = entradas
    .filter((e) => e.forma_pagamento === "Dinheiro")
    .reduce((t, e) => t + Number(e.valor || 0), 0);

  const saidasDinheiro = saidas
    .filter((s) => s.destino_financeiro === "CAIXA_DINHEIRO")
    .reduce((t, s) => t + Number(s.valor || 0), 0);

  const saldoDinheiro = entradasDinheiro - saidasDinheiro;

  const entradasBanco = entradas
    .filter((e) => e.destino_financeiro === "CONTA_BRADESCO")
    .reduce((t, e) => t + Number(e.valor || 0), 0);

  const saidasBanco = saidas
    .filter((s) => s.destino_financeiro === "CONTA_BRADESCO")
    .reduce((t, s) => t + Number(s.valor || 0), 0);

  const saldoBanco = entradasBanco - saidasBanco;

  const saldoGeral = saldoDinheiro + saldoBanco;

  // ================= RESUMO DO DIA (TURNOS) =================
  const resumoDia = useMemo(() => {
    const turnos = fechamentosDia
      .slice()
      .sort((a, b) => fechamentoTimestamp(a) - fechamentoTimestamp(b))
      .map((f) => {
        const entradasT = calcEntradasDia(f);
        const saidasT = calcSaidasDia(f);
        const saldoT = entradasT - saidasT;

        const ts = fechamentoTimestamp(f);
        return {
          id: f.id,
          hora: formatTimeBR(new Date(ts).toISOString()),
          venda: Number(f.venda_total || 0),
          entradas: entradasT,
          saidas: saidasT,
          saldo: saldoT,
          tsFech: ts,
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
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; }
          a { color: black !important; text-decoration: none !important; }
          .avoid-break { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div className="no-print max-w-5xl mx-auto bg-white rounded shadow p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">
              📊 Posição Financeira — {ano}
            </h1>
            <p className="text-sm text-gray-600">
              PDF único (posição + turnos do dia selecionado + saídas detalhadas)
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

      <div className="print-area max-w-5xl mx-auto bg-white rounded shadow p-6">
        <div className="border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-blue-800">
            Drogaria Rede Fabiano
          </h2>
          <p className="text-sm text-gray-600">
            Relatório Único — Posição Financeira + Turnos do Dia (com Saídas Detalhadas)
          </p>
          <p className="text-xs text-gray-500">
            Loja: {LOJA} • Ano: {ano} • Dia: {formatDateBR(dataSelecionada)} • Gerado em{" "}
            {new Date().toLocaleString("pt-BR")}
          </p>
        </div>

        {loading ? (
          <p>Carregando dados…</p>
        ) : (
          <div className="avoid-break">
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

        <div className="mt-8 border rounded p-4 bg-slate-50">
          <h3 className="text-lg font-bold text-blue-800 mb-2">
            📆 Resumo do Dia — Turnos ({formatDateBR(dataSelecionada)})
          </h3>

          {loadingFechDia ? (
            <p>Carregando fechamentos do dia…</p>
          ) : resumoDia.turnos.length === 0 ? (
            <p className="text-sm text-gray-600">
              Nenhum fechamento encontrado na data selecionada.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {resumoDia.turnos.map((t, idx) => {
                const lista = saidasPorTurno[String(t.id)] || [];
                const totalDetalhado = lista.reduce((acc, x) => acc + Number(x.valor || 0), 0);

                const diaStartTs = new Date(startOfDayTZ(dataSelecionada)).getTime();
                const prevTs = idx === 0 ? diaStartTs : resumoDia.turnos[idx - 1].tsFech;

                const janelaInicio = idx === 0 ? "início do dia" : formatTimeBR(new Date(prevTs).toISOString());
                const janelaFim = formatTimeBR(new Date(t.tsFech).toISOString());

                return (
                  <div key={t.id} className="bg-white border rounded p-3 avoid-break">
                    <p className="font-bold text-slate-800">
                      Turno {idx + 1} • {t.hora} • ID {t.id}
                    </p>
                    <p className="text-sm">Venda: R$ {fmt(t.venda)}</p>
                    <p className="text-sm text-green-700">Entradas: R$ {fmt(t.entradas)}</p>
                    <p className="text-sm text-red-700">Saídas (Resumo): R$ {fmt(t.saidas)}</p>

                    <div className="mt-3 border-t pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-700">Saídas detalhadas do turno</p>
                        <p className="text-sm text-red-700 font-semibold">Total: R$ {fmt(totalDetalhado)}</p>
                      </div>

                      {loadingSaidasTurno ? (
                        <p className="text-sm text-gray-600 mt-2">Carregando saídas detalhadas…</p>
                      ) : lista.length === 0 ? (
                        <p className="text-sm text-gray-600 mt-2">Nenhuma saída registrada neste turno.</p>
                      ) : (
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full text-sm border">
                            <thead className="bg-slate-100">
                              <tr>
                                <th className="text-left p-2 border">Hora</th>
                                <th className="text-left p-2 border">Descrição</th>
                                <th className="text-left p-2 border">Destino</th>
                                <th className="text-right p-2 border">Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lista.map((s) => (
                                <tr key={s.id}>
                                  <td className="p-2 border whitespace-nowrap">{formatTimeBR(s.created_at)}</td>
                                  <td className="p-2 border">{s.descricao || "—"}</td>
                                  <td className="p-2 border">{s.destino_financeiro || s.forma_pagamento || "—"}</td>
                                  <td className="p-2 border text-right text-red-700 font-semibold">R$ {fmt(s.valor)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="mt-2 text-xs text-gray-500">
                        Janela do turno: {janelaInicio} → {janelaFim}
                      </div>
                    </div>

                    <p className="border-t mt-3 pt-3 font-bold">
                      Total do turno:{" "}
                      <span className={t.saldo >= 0 ? "text-green-700" : "text-red-700"}>
                        R$ {fmt(t.saldo)}
                      </span>
                    </p>
                  </div>
                );
              })}

              {/* ✅ BLOCO EXTRA (se houver) */}
              {saidasAposUltimoFech.length > 0 && (
                <div className="bg-white border rounded p-3 avoid-break">
                  <p className="font-bold text-slate-800">Saídas após o último fechamento</p>
                  <p className="text-xs text-gray-500 mb-2">
                    Essas saídas pertencem ao próximo turno (ainda não fechado).
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left p-2 border">Hora</th>
                          <th className="text-left p-2 border">Descrição</th>
                          <th className="text-left p-2 border">Destino</th>
                          <th className="text-right p-2 border">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saidasAposUltimoFech.map((s) => (
                          <tr key={s.id}>
                            <td className="p-2 border whitespace-nowrap">{formatTimeBR(s.created_at)}</td>
                            <td className="p-2 border">{s.descricao || "—"}</td>
                            <td className="p-2 border">{s.destino_financeiro || s.forma_pagamento || "—"}</td>
                            <td className="p-2 border text-right text-red-700 font-semibold">R$ {fmt(s.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-white border rounded p-3 text-center avoid-break">
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

        <div className="mt-10 text-right text-sm">
          <p className="font-semibold">Fernando dos Santos Pereira</p>
          <p className="text-gray-500">Responsável</p>
        </div>
      </div>
    </main>
  );
}