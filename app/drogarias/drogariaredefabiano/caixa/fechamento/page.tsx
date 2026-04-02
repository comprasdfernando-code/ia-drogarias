"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOJA = "drogariaredefabiano";

type Fechamento = {
  id: string;
  loja: string;
  data: string;
  venda_total: number | null;
  venda_fiado: number | null;
  receb_fiado: number | null;
  dinheiro: number | null;
  pix_cnpj: number | null;
  pix_qr: number | null;
  cartoes: number | null;
  sangrias: number | null;
  despesas: number | null;
  boletos: number | null;
  compras: number | null;
  saldo_dia: number | null;
  desc_sangrias: string | null;
  desc_despesas: string | null;
  desc_boletos: string | null;
  desc_compras: string | null;
};

type Movimentacao = {
  id: string;
  loja: string;
  tipo: "Entrada" | "Saída";
  descricao: string | null;
  valor: number;
  forma_pagamento: string | null;
  destino_financeiro: string | null;
  linha_digitavel: string | null;
  data: string;
  caixa_sessao_id: string | null;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfDayISO(dateStr: string) {
  return `${dateStr}T00:00:00`;
}

function endOfDayISO(dateStr: string) {
  return `${dateStr}T23:59:59`;
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(n: number | null | undefined) {
  return Number(n || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateBR(value: string | null | undefined) {
  if (!value) return "—";
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T12:00:00`).toLocaleDateString("pt-BR");
  }
  return new Date(s).toLocaleDateString("pt-BR");
}

function formatDateTimeBR(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function getFechamentoDiaKey(data: string | null | undefined) {
  if (!data) return "";
  return String(data).slice(0, 10);
}

function calcEntradas(f: Fechamento) {
  return (
    Number(f.dinheiro || 0) +
    Number(f.pix_cnpj || 0) +
    Number(f.pix_qr || 0) +
    Number(f.cartoes || 0) +
    Number(f.receb_fiado || 0)
  );
}

function calcSaidas(f: Fechamento) {
  return (
    Number(f.sangrias || 0) +
    Number(f.despesas || 0) +
    Number(f.boletos || 0) +
    Number(f.compras || 0)
  );
}

function calcSaldo(f: Fechamento) {
  return calcEntradas(f) - calcSaidas(f);
}

function CardResumo({
  titulo,
  valor,
  cor = "blue",
  subtitulo,
}: {
  titulo: string;
  valor: number;
  cor?: "blue" | "green" | "red" | "orange";
  subtitulo?: string;
}) {
  const cores = {
    blue: "text-blue-700",
    green: "text-green-700",
    red: "text-red-700",
    orange: "text-orange-700",
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm p-4">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className={`text-xl font-bold mt-1 ${cores[cor]}`}>R$ {fmt(valor)}</p>
      {subtitulo ? <p className="text-xs text-gray-400 mt-1">{subtitulo}</p> : null}
    </div>
  );
}

function LinhaMini({ label, valor, cor = "text-gray-800" }: { label: string; valor: number; cor?: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1 gap-3">
      <span className="text-gray-600">{label}</span>
      <span className={`font-semibold ${cor}`}>R$ {fmt(valor)}</span>
    </div>
  );
}

export default function CaixaFechamentoPage() {
  const hoje = useMemo(() => new Date(), []);
  const inicioPadrao = useMemo(() => toISODate(addDays(hoje, -30)), [hoje]);
  const fimPadrao = useMemo(() => toISODate(hoje), [hoje]);

  const [carregando, setCarregando] = useState(false);
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);

  const [dataIni, setDataIni] = useState(inicioPadrao);
  const [dataFim, setDataFim] = useState(fimPadrao);
  const [tipoMov, setTipoMov] = useState("");
  const [formaMov, setFormaMov] = useState("");
  const [destinoMov, setDestinoMov] = useState("");
  const [busca, setBusca] = useState("");
  const [somenteComDivergencia, setSomenteComDivergencia] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState("");

  useEffect(() => {
    carregarRelatorios(inicioPadrao, fimPadrao);
  }, [inicioPadrao, fimPadrao]);

  async function carregarRelatorios(ini = dataIni, fim = dataFim) {
    if (!ini || !fim) {
      alert("Selecione data inicial e final.");
      return;
    }

    setCarregando(true);

    try {
      const [{ data: dataFech, error: errFech }, { data: dataMov, error: errMov }] = await Promise.all([
        supabase
          .from("caixa_diario")
          .select("*")
          .eq("loja", LOJA)
          .gte("data", startOfDayISO(ini))
          .lte("data", endOfDayISO(fim))
          .order("data", { ascending: false }),
        supabase
          .from("movimentacoes_caixa")
          .select("*")
          .eq("loja", LOJA)
          .gte("data", startOfDayISO(ini))
          .lte("data", endOfDayISO(fim))
          .order("data", { ascending: false })
          .limit(2000),
      ]);

      if (errFech) throw errFech;
      if (errMov) throw errMov;

      setFechamentos((dataFech as Fechamento[]) || []);
      setMovimentacoes((dataMov as Movimentacao[]) || []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar fechamentos.");
    } finally {
      setCarregando(false);
    }
  }

  function limparFiltros() {
    setDataIni(inicioPadrao);
    setDataFim(fimPadrao);
    setTipoMov("");
    setFormaMov("");
    setDestinoMov("");
    setBusca("");
    setSomenteComDivergencia(false);
    setDiaSelecionado("");
    carregarRelatorios(inicioPadrao, fimPadrao);
  }

  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter((m) => {
      if (tipoMov && m.tipo !== tipoMov) return false;
      if (formaMov && (m.forma_pagamento || "") !== formaMov) return false;
      if (destinoMov && (m.destino_financeiro || "") !== destinoMov) return false;

      if (diaSelecionado) {
        const diaMov = String(m.data).slice(0, 10);
        if (diaMov !== diaSelecionado) return false;
      }

      if (busca) {
        const texto = JSON.stringify(m).toLowerCase();
        if (!texto.includes(busca.toLowerCase())) return false;
      }

      return true;
    });
  }, [movimentacoes, tipoMov, formaMov, destinoMov, busca, diaSelecionado]);

  const resumoPorDia = useMemo(() => {
    const mapa = new Map<
      string,
      {
        dia: string;
        fechamento: Fechamento;
        entradasFechamento: number;
        saidasFechamento: number;
        saldoFechamento: number;
        movs: Movimentacao[];
        dinheiroMov: number;
        cartaoMov: number;
        pixMov: number;
        entradasMov: number;
        saidasMov: number;
      }
    >();

    for (const f of fechamentos) {
      const dia = getFechamentoDiaKey(f.data);
      if (!dia) continue;

      mapa.set(dia, {
        dia,
        fechamento: f,
        entradasFechamento: calcEntradas(f),
        saidasFechamento: calcSaidas(f),
        saldoFechamento: calcSaldo(f),
        movs: [],
        dinheiroMov: 0,
        cartaoMov: 0,
        pixMov: 0,
        entradasMov: 0,
        saidasMov: 0,
      });
    }

    for (const m of movimentacoes) {
      const dia = getFechamentoDiaKey(m.data);
      const item = mapa.get(dia);
      if (!item) continue;

      item.movs.push(m);

      const valor = Number(m.valor || 0);
      const forma = (m.forma_pagamento || "").toLowerCase();
      const tipo = m.tipo;

      if (tipo === "Entrada") item.entradasMov += valor;
      if (tipo === "Saída") item.saidasMov += valor;

      if (forma.includes("dinheiro")) item.dinheiroMov += valor;
      if (forma.includes("cart") || forma.includes("cartão")) item.cartaoMov += valor;
      if (forma.includes("pix")) item.pixMov += valor;
    }

    return Array.from(mapa.values())
      .map((item) => {
        const divergenciaCartao = Math.abs(Number(item.fechamento.cartoes || 0) - item.cartaoMov);
        const divergenciaPix = Math.abs(
          Number(item.fechamento.pix_cnpj || 0) + Number(item.fechamento.pix_qr || 0) - item.pixMov
        );
        const divergenciaDinheiro = Math.abs(Number(item.fechamento.dinheiro || 0) - item.dinheiroMov);

        return {
          ...item,
          divergenciaCartao,
          divergenciaPix,
          divergenciaDinheiro,
          temDivergencia: divergenciaCartao > 0.009 || divergenciaPix > 0.009 || divergenciaDinheiro > 0.009,
        };
      })
      .sort((a, b) => b.dia.localeCompare(a.dia));
  }, [fechamentos, movimentacoes]);

  const diasDisponiveis = useMemo(() => resumoPorDia.map((d) => d.dia), [resumoPorDia]);

  const diasFiltrados = useMemo(() => {
    return resumoPorDia.filter((item) => {
      if (diaSelecionado && item.dia !== diaSelecionado) return false;
      if (somenteComDivergencia && !item.temDivergencia) return false;

      if (busca) {
        const texto = JSON.stringify(item.fechamento).toLowerCase();
        if (!texto.includes(busca.toLowerCase())) return false;
      }

      return true;
    });
  }, [resumoPorDia, diaSelecionado, somenteComDivergencia, busca]);

  const detalheDia = useMemo(() => {
    if (!diaSelecionado) return diasFiltrados[0] || null;
    return diasFiltrados.find((d) => d.dia === diaSelecionado) || null;
  }, [diasFiltrados, diaSelecionado]);

  const movimentacoesDia = useMemo(() => {
    if (!detalheDia) return movimentacoesFiltradas;
    return movimentacoesFiltradas.filter((m) => String(m.data).slice(0, 10) === detalheDia.dia);
  }, [movimentacoesFiltradas, detalheDia]);

  const resumoGeral = useMemo(() => {
    const vendaTotal = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.venda_total || 0), 0);
    const dinheiro = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.dinheiro || 0), 0);
    const cartoes = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.cartoes || 0), 0);
    const pix = diasFiltrados.reduce(
      (t, d) => t + Number(d.fechamento.pix_cnpj || 0) + Number(d.fechamento.pix_qr || 0),
      0
    );
    const despesas = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.despesas || 0), 0);
    const sangrias = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.sangrias || 0), 0);
    const boletos = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.boletos || 0), 0);
    const compras = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.compras || 0), 0);
    const saldo = diasFiltrados.reduce((t, d) => t + d.saldoFechamento, 0);
    const recebFiado = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.receb_fiado || 0), 0);
    const vendaFiado = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.venda_fiado || 0), 0);

    return {
      vendaTotal,
      dinheiro,
      cartoes,
      pix,
      despesas,
      sangrias,
      boletos,
      compras,
      saldo,
      recebFiado,
      vendaFiado,
    };
  }, [diasFiltrados]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">📄 Fechamentos do Caixa</h1>
            <p className="text-sm text-gray-600">Painel completo por dia, com visão detalhada de dinheiro, cartão, pix e despesas.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/drogarias/drogariaredefabiano/caixa"
              className="bg-white border hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold"
            >
              ← Voltar ao Caixa
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h2 className="font-bold text-lg text-blue-700 mb-4">🔎 Filtros</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <input type="date" value={dataIni} onChange={(e) => setDataIni(e.target.value)} className="border p-2 rounded-lg" />
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="border p-2 rounded-lg" />

            <select value={tipoMov} onChange={(e) => setTipoMov(e.target.value)} className="border p-2 rounded-lg">
              <option value="">Tipo mov.</option>
              <option value="Entrada">Entrada</option>
              <option value="Saída">Saída</option>
            </select>

            <select value={formaMov} onChange={(e) => setFormaMov(e.target.value)} className="border p-2 rounded-lg">
              <option value="">Forma pgto</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Pix">Pix</option>
              <option value="Pix CNPJ">Pix CNPJ</option>
              <option value="Pix QR">Pix QR</option>
              <option value="Cartão">Cartão</option>
              <option value="Boleto">Boleto</option>
              <option value="Conta Bancária">Conta Bancária</option>
              <option value="Receb Fiado">Receb Fiado</option>
              <option value="Fiado">Fiado</option>
            </select>

            <select value={destinoMov} onChange={(e) => setDestinoMov(e.target.value)} className="border p-2 rounded-lg">
              <option value="">Destino</option>
              <option value="CAIXA_DINHEIRO">Caixa Dinheiro</option>
              <option value="CONTA_BRADESCO">Conta Bancária</option>
            </select>

            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar descrição, valor, linha..."
              className="border p-2 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <select value={diaSelecionado} onChange={(e) => setDiaSelecionado(e.target.value)} className="border p-2 rounded-lg">
              <option value="">Todos os dias</option>
              {diasDisponiveis.map((dia) => (
                <option key={dia} value={dia}>
                  {formatDateBR(dia)}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50">
              <input
                type="checkbox"
                checked={somenteComDivergencia}
                onChange={(e) => setSomenteComDivergencia(e.target.checked)}
              />
              <span className="text-sm text-gray-700">Mostrar só dias com divergência</span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => carregarRelatorios()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Filtrar
              </button>
              <button
                onClick={limparFiltros}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <CardResumo titulo="Venda Total" valor={resumoGeral.vendaTotal} cor="blue" />
          <CardResumo titulo="Dinheiro" valor={resumoGeral.dinheiro} cor="green" />
          <CardResumo titulo="Cartões" valor={resumoGeral.cartoes} cor="green" />
          <CardResumo titulo="Pix Total" valor={resumoGeral.pix} cor="green" />
          <CardResumo titulo="Despesas" valor={resumoGeral.despesas} cor="red" />
          <CardResumo titulo="Sangrias" valor={resumoGeral.sangrias} cor="red" />
          <CardResumo titulo="Boletos" valor={resumoGeral.boletos} cor="red" />
          <CardResumo titulo="Compras" valor={resumoGeral.compras} cor="red" />
          <CardResumo titulo="Receb. Fiado" valor={resumoGeral.recebFiado} cor="orange" />
          <CardResumo titulo="Venda Fiado" valor={resumoGeral.vendaFiado} cor="orange" />
          <CardResumo titulo="Saldo Final" valor={resumoGeral.saldo} cor={resumoGeral.saldo >= 0 ? "blue" : "red"} />
          <CardResumo titulo="Dias" valor={diasFiltrados.length} subtitulo="Quantidade de fechamentos listados" />
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-blue-700">📘 Fechamentos por Dia</h2>
            <span className="text-xs text-gray-500">{diasFiltrados.length} dia(s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-blue-100 text-blue-800">
                <tr>
                  <th className="p-2 border">Data</th>
                  <th className="p-2 border">Venda Total</th>
                  <th className="p-2 border">Dinheiro</th>
                  <th className="p-2 border">Cartões</th>
                  <th className="p-2 border">Pix</th>
                  <th className="p-2 border">Despesas</th>
                  <th className="p-2 border">Sangrias</th>
                  <th className="p-2 border">Boletos</th>
                  <th className="p-2 border">Compras</th>
                  <th className="p-2 border">Saldo</th>
                  <th className="p-2 border">Divergência</th>
                  <th className="p-2 border">Ação</th>
                </tr>
              </thead>
              <tbody>
                {diasFiltrados.map((item) => {
                  const pixDia = Number(item.fechamento.pix_cnpj || 0) + Number(item.fechamento.pix_qr || 0);
                  return (
                    <tr key={item.dia} className="hover:bg-gray-50">
                      <td className="p-2 border text-center">{formatDateBR(item.dia)}</td>
                      <td className="p-2 border text-right">R$ {fmt(item.fechamento.venda_total)}</td>
                      <td className="p-2 border text-right">R$ {fmt(item.fechamento.dinheiro)}</td>
                      <td className="p-2 border text-right text-green-700 font-semibold">R$ {fmt(item.fechamento.cartoes)}</td>
                      <td className="p-2 border text-right text-green-700 font-semibold">R$ {fmt(pixDia)}</td>
                      <td className="p-2 border text-right text-red-700">R$ {fmt(item.fechamento.despesas)}</td>
                      <td className="p-2 border text-right text-red-700">R$ {fmt(item.fechamento.sangrias)}</td>
                      <td className="p-2 border text-right text-red-700">R$ {fmt(item.fechamento.boletos)}</td>
                      <td className="p-2 border text-right text-red-700">R$ {fmt(item.fechamento.compras)}</td>
                      <td className={`p-2 border text-right font-bold ${item.saldoFechamento >= 0 ? "text-green-700" : "text-red-700"}`}>
                        R$ {fmt(item.saldoFechamento)}
                      </td>
                      <td className="p-2 border text-center">
                        {item.temDivergencia ? (
                          <span className="text-red-700 font-semibold">Sim</span>
                        ) : (
                          <span className="text-green-700 font-semibold">OK</span>
                        )}
                      </td>
                      <td className="p-2 border text-center">
                        <button
                          onClick={() => setDiaSelecionado(item.dia)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold"
                        >
                          Ver Dia
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {diasFiltrados.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-gray-500" colSpan={12}>
                      Nenhum fechamento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {detalheDia && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="font-bold text-lg text-blue-700 mb-3">💰 Detalhe do Dia — {formatDateBR(detalheDia.dia)}</h3>
                <LinhaMini label="Venda Total" valor={Number(detalheDia.fechamento.venda_total || 0)} cor="text-blue-700" />
                <LinhaMini label="Dinheiro" valor={Number(detalheDia.fechamento.dinheiro || 0)} cor="text-green-700" />
                <LinhaMini label="Pix CNPJ" valor={Number(detalheDia.fechamento.pix_cnpj || 0)} cor="text-green-700" />
                <LinhaMini label="Pix QR" valor={Number(detalheDia.fechamento.pix_qr || 0)} cor="text-green-700" />
                <LinhaMini label="Cartões" valor={Number(detalheDia.fechamento.cartoes || 0)} cor="text-green-700" />
                <LinhaMini label="Receb. Fiado" valor={Number(detalheDia.fechamento.receb_fiado || 0)} cor="text-orange-700" />
                <LinhaMini label="Venda Fiado" valor={Number(detalheDia.fechamento.venda_fiado || 0)} cor="text-orange-700" />
                <div className="border-t mt-2 pt-2">
                  <LinhaMini label="Entradas do fechamento" valor={detalheDia.entradasFechamento} cor="text-green-700" />
                  <LinhaMini label="Saídas do fechamento" valor={detalheDia.saidasFechamento} cor="text-red-700" />
                  <LinhaMini label="Saldo do fechamento" valor={detalheDia.saldoFechamento} cor={detalheDia.saldoFechamento >= 0 ? "text-blue-700" : "text-red-700"} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="font-bold text-lg text-blue-700 mb-3">📉 Saídas Detalhadas</h3>
                <LinhaMini label="Sangrias" valor={Number(detalheDia.fechamento.sangrias || 0)} cor="text-red-700" />
                <LinhaMini label="Despesas" valor={Number(detalheDia.fechamento.despesas || 0)} cor="text-red-700" />
                <LinhaMini label="Boletos" valor={Number(detalheDia.fechamento.boletos || 0)} cor="text-red-700" />
                <LinhaMini label="Compras" valor={Number(detalheDia.fechamento.compras || 0)} cor="text-red-700" />

                <div className="mt-4 space-y-3 text-sm">
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <p className="font-semibold text-gray-700 mb-1">Descrição das sangrias</p>
                    <p className="text-gray-600">{detalheDia.fechamento.desc_sangrias || "—"}</p>
                  </div>
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <p className="font-semibold text-gray-700 mb-1">Descrição das despesas</p>
                    <p className="text-gray-600">{detalheDia.fechamento.desc_despesas || "—"}</p>
                  </div>
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <p className="font-semibold text-gray-700 mb-1">Descrição dos boletos</p>
                    <p className="text-gray-600">{detalheDia.fechamento.desc_boletos || "—"}</p>
                  </div>
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <p className="font-semibold text-gray-700 mb-1">Descrição das compras</p>
                    <p className="text-gray-600">{detalheDia.fechamento.desc_compras || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="font-bold text-lg text-blue-700 mb-3">🧾 Conferência do Dia</h3>
                <LinhaMini label="Mov. Dinheiro" valor={detalheDia.dinheiroMov} cor="text-green-700" />
                <LinhaMini label="Mov. Cartão" valor={detalheDia.cartaoMov} cor="text-green-700" />
                <LinhaMini label="Mov. Pix" valor={detalheDia.pixMov} cor="text-green-700" />
                <LinhaMini label="Entradas mov." valor={detalheDia.entradasMov} cor="text-green-700" />
                <LinhaMini label="Saídas mov." valor={detalheDia.saidasMov} cor="text-red-700" />

                <div className="border-t mt-3 pt-3">
                  <LinhaMini label="Divergência dinheiro" valor={detalheDia.divergenciaDinheiro} cor={detalheDia.divergenciaDinheiro > 0.009 ? "text-red-700" : "text-green-700"} />
                  <LinhaMini label="Divergência cartão" valor={detalheDia.divergenciaCartao} cor={detalheDia.divergenciaCartao > 0.009 ? "text-red-700" : "text-green-700"} />
                  <LinhaMini label="Divergência pix" valor={detalheDia.divergenciaPix} cor={detalheDia.divergenciaPix > 0.009 ? "text-red-700" : "text-green-700"} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-blue-700">💸 Movimentações do Dia {formatDateBR(detalheDia.dia)}</h2>
                <span className="text-xs text-gray-500">{movimentacoesDia.length} registro(s)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-2 border">Data/Hora</th>
                      <th className="p-2 border">Tipo</th>
                      <th className="p-2 border">Descrição</th>
                      <th className="p-2 border">Valor</th>
                      <th className="p-2 border">Forma</th>
                      <th className="p-2 border">Destino</th>
                      <th className="p-2 border">Linha digitável</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimentacoesDia.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="p-2 border text-center">{formatDateTimeBR(m.data)}</td>
                        <td className={`p-2 border text-center font-semibold ${m.tipo === "Entrada" ? "text-green-700" : "text-red-700"}`}>
                          {m.tipo}
                        </td>
                        <td className="p-2 border">{m.descricao || "—"}</td>
                        <td className="p-2 border text-right">R$ {fmt(m.valor)}</td>
                        <td className="p-2 border text-center">{m.forma_pagamento || "—"}</td>
                        <td className="p-2 border text-center">{m.destino_financeiro || "—"}</td>
                        <td className="p-2 border text-center font-mono text-xs">{m.linha_digitavel || "—"}</td>
                      </tr>
                    ))}

                    {movimentacoesDia.length === 0 && (
                      <tr>
                        <td className="p-4 text-center text-gray-500" colSpan={7}>
                          Nenhuma movimentação encontrada nesse dia.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {carregando && <p className="text-sm text-gray-600 mt-4">Carregando fechamentos…</p>}
      </div>
    </main>
  );
}
