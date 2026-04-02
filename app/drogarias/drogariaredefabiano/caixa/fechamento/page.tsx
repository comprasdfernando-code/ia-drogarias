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

type CaixaSessao = {
  id: string;
  loja_slug: string;
  operador: string | null;
  turno: string | null;
  status: string | null;
  aberto_em: string | null;
  fechado_em: string | null;
};

type CieloResumoDia = {
  dia: string;
  bruto: number;
  liquido: number;
  taxa: number;
  vendas: number;
  origem: string;
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

function getDiaKey(value: string | null | undefined) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function parseBRNumber(input: string | number | null | undefined) {
  if (typeof input === "number") return input;
  const s = String(input || "")
    .replace(/R\$/gi, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
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

function baixarCSV(nome: string, linhas: string[][]) {
  const conteudo = linhas.map((l) => l.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

function detectarSeparadorCSV(texto: string) {
  const primeira = texto.split(/\r?\n/).find(Boolean) || "";
  const semicolon = (primeira.match(/;/g) || []).length;
  const comma = (primeira.match(/,/g) || []).length;
  return semicolon >= comma ? ";" : ",";
}

function normalizarCabecalho(s: string) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseCSVLine(line: string, separator: string) {
  const out: string[] = [];
  let cur = "";
  let inside = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inside && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inside = !inside;
      }
    } else if (ch === separator && !inside) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

function extrairDiaDeTextoData(s: string) {
  const txt = String(s || "").trim();
  const br = txt.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const iso = txt.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return "";
}

function importarCieloCSV(texto: string, nomeArquivo: string) {
  const sep = detectarSeparadorCSV(texto);
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length < 2) return [] as CieloResumoDia[];

  const headers = parseCSVLine(linhas[0], sep).map(normalizarCabecalho);
  const idxData = headers.findIndex((h) => h.includes("data"));
  const idxBruto = headers.findIndex((h) => h.includes("bruto"));
  const idxLiquido = headers.findIndex((h) => h.includes("liquido"));
  const idxTaxa = headers.findIndex((h) => h.includes("taxa") || h.includes("tarifa"));
  const idxQtd = headers.findIndex((h) => h.includes("qtd") || h.includes("quantidade") || h.includes("vendas"));

  const mapa = new Map<string, CieloResumoDia>();

  for (let i = 1; i < linhas.length; i++) {
    const cols = parseCSVLine(linhas[i], sep);
    const dia = extrairDiaDeTextoData(cols[idxData] || "");
    if (!dia) continue;

    const bruto = idxBruto >= 0 ? parseBRNumber(cols[idxBruto]) : 0;
    const liquido = idxLiquido >= 0 ? parseBRNumber(cols[idxLiquido]) : 0;
    const taxaRaw = idxTaxa >= 0 ? cols[idxTaxa] : "0";
    const taxa = Math.abs(parseBRNumber(taxaRaw));
    const vendas = idxQtd >= 0 ? parseBRNumber(cols[idxQtd]) : 0;

    const atual = mapa.get(dia) || {
      dia,
      bruto: 0,
      liquido: 0,
      taxa: 0,
      vendas: 0,
      origem: nomeArquivo,
    };

    atual.bruto += bruto;
    atual.liquido += liquido;
    atual.taxa += taxa;
    atual.vendas += vendas;
    mapa.set(dia, atual);
  }

  return Array.from(mapa.values()).sort((a, b) => b.dia.localeCompare(a.dia));
}

export default function CaixaFechamentoPage() {
  const hoje = useMemo(() => new Date(), []);
  const inicioPadrao = useMemo(() => toISODate(addDays(hoje, -30)), [hoje]);
  const fimPadrao = useMemo(() => toISODate(hoje), [hoje]);

  const [carregando, setCarregando] = useState(false);
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [sessoes, setSessoes] = useState<CaixaSessao[]>([]);
  const [cieloDias, setCieloDias] = useState<CieloResumoDia[]>([]);
  const [nomeArquivoCielo, setNomeArquivoCielo] = useState("");

  const [dataIni, setDataIni] = useState(inicioPadrao);
  const [dataFim, setDataFim] = useState(fimPadrao);
  const [tipoMov, setTipoMov] = useState("");
  const [formaMov, setFormaMov] = useState("");
  const [destinoMov, setDestinoMov] = useState("");
  const [busca, setBusca] = useState("");
  const [somenteComDivergencia, setSomenteComDivergencia] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState("");
  const [sessaoSelecionada, setSessaoSelecionada] = useState("");
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});

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
      const [fechRet, movRet, sesRet] = await Promise.all([
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
          .limit(4000),
        supabase
          .from("caixa_sessoes")
          .select("*")
          .eq("loja_slug", LOJA)
          .order("aberto_em", { ascending: false })
          .limit(500),
      ]);

      if (fechRet.error) throw fechRet.error;
      if (movRet.error) throw movRet.error;
      if (sesRet.error) throw sesRet.error;

      setFechamentos((fechRet.data as Fechamento[]) || []);
      setMovimentacoes((movRet.data as Movimentacao[]) || []);
      setSessoes((sesRet.data as CaixaSessao[]) || []);
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
    setSessaoSelecionada("");
    carregarRelatorios(inicioPadrao, fimPadrao);
  }

  function onArquivoCielo(file: File | null) {
    if (!file) return;
    setNomeArquivoCielo(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const texto = String(reader.result || "");
      const resumido = importarCieloCSV(texto, file.name);
      setCieloDias(resumido);
    };
    reader.readAsText(file, "utf-8");
  }

  function exportarFechamentosCSV() {
    const linhas = [
      [
        "Data",
        "ID",
        "Hora",
        "Operador",
        "Turno",
        "Sessão",
        "Venda Total",
        "Dinheiro",
        "Cartões",
        "Pix",
        "Receb Fiado",
        "Venda Fiado",
        "Despesas",
        "Sangrias",
        "Boletos",
        "Compras",
        "Saldo",
        "Cielo Bruto",
        "Cielo Líquido",
        "Dif Cartão x Cielo Líq",
      ],
      ...diasFiltrados.map((item) => {
        const pix = Number(item.fechamento.pix_cnpj || 0) + Number(item.fechamento.pix_qr || 0);
        return [
          formatDateBR(item.dia),
          String(item.fechamento.id).slice(0, 8),
          formatDateTimeBR(item.fechamento.data).split(", ")[1] || "",
          item.operador,
          item.turno,
          item.sessaoLabel,
          fmt(item.fechamento.venda_total),
          fmt(item.fechamento.dinheiro),
          fmt(item.fechamento.cartoes),
          fmt(pix),
          fmt(item.fechamento.receb_fiado),
          fmt(item.fechamento.venda_fiado),
          fmt(item.fechamento.despesas),
          fmt(item.fechamento.sangrias),
          fmt(item.fechamento.boletos),
          fmt(item.fechamento.compras),
          fmt(item.saldoFechamento),
          fmt(item.cieloBruto),
          fmt(item.cieloLiquido),
          fmt(item.diffCartaoXCieloLiquido),
        ];
      }),
    ];
    baixarCSV(`fechamentos_${dataIni}_${dataFim}.csv`, linhas);
  }

  function exportarMovimentacoesCSV() {
    const linhas = [
      ["Data/Hora", "Tipo", "Descrição", "Valor", "Forma", "Destino", "Sessão", "Linha digitável"],
      ...movimentacoesDia.map((m) => [
        formatDateTimeBR(m.data),
        m.tipo,
        m.descricao || "",
        fmt(m.valor),
        m.forma_pagamento || "",
        m.destino_financeiro || "",
        m.caixa_sessao_id || "",
        m.linha_digitavel || "",
      ]),
    ];
    baixarCSV(`movimentacoes_${detalheDia?.dia || dataIni}.csv`, linhas);
  }

  const sessoesMap = useMemo(() => {
    const map = new Map<string, CaixaSessao>();
    for (const s of sessoes) map.set(String(s.id), s);
    return map;
  }, [sessoes]);

  const cieloMap = useMemo(() => {
    const map = new Map<string, CieloResumoDia>();
    for (const c of cieloDias) map.set(c.dia, c);
    return map;
  }, [cieloDias]);

  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter((m) => {
      if (tipoMov && m.tipo !== tipoMov) return false;
      if (formaMov && (m.forma_pagamento || "") !== formaMov) return false;
      if (destinoMov && (m.destino_financeiro || "") !== destinoMov) return false;
      if (sessaoSelecionada && String(m.caixa_sessao_id || "") !== sessaoSelecionada) return false;
      if (diaSelecionado && getDiaKey(m.data) !== diaSelecionado) return false;
      if (busca) {
        const texto = JSON.stringify(m).toLowerCase();
        if (!texto.includes(busca.toLowerCase())) return false;
      }
      return true;
    });
  }, [movimentacoes, tipoMov, formaMov, destinoMov, sessaoSelecionada, diaSelecionado, busca]);

  const resumidos = useMemo(() => {
    return fechamentos
      .map((f) => {
        const dia = getDiaKey(f.data);
        const movsDoDia = movimentacoes.filter((m) => getDiaKey(m.data) === dia);
        const sessao = f && sessaoSelecionada
          ? sessoesMap.get(sessaoSelecionada)
          : movsDoDia.find((m) => m.caixa_sessao_id && sessoesMap.get(String(m.caixa_sessao_id)))
            ? sessoesMap.get(String(movsDoDia.find((m) => m.caixa_sessao_id && sessoesMap.get(String(m.caixa_sessao_id)))?.caixa_sessao_id))
            : null;

        const dinheiroMov = movsDoDia
          .filter((m) => (m.forma_pagamento || "").toLowerCase().includes("dinheiro"))
          .reduce((t, m) => t + Number(m.valor || 0), 0);

        const cartaoMov = movsDoDia
          .filter((m) => {
            const forma = (m.forma_pagamento || "").toLowerCase();
            return forma.includes("cart") || forma.includes("cartão");
          })
          .reduce((t, m) => t + Number(m.valor || 0), 0);

        const pixMov = movsDoDia
          .filter((m) => (m.forma_pagamento || "").toLowerCase().includes("pix"))
          .reduce((t, m) => t + Number(m.valor || 0), 0);

        const entradasMov = movsDoDia.filter((m) => m.tipo === "Entrada").reduce((t, m) => t + Number(m.valor || 0), 0);
        const saidasMov = movsDoDia.filter((m) => m.tipo === "Saída").reduce((t, m) => t + Number(m.valor || 0), 0);

        const divergenciaCartao = Math.abs(Number(f.cartoes || 0) - cartaoMov);
        const divergenciaPix = Math.abs(Number(f.pix_cnpj || 0) + Number(f.pix_qr || 0) - pixMov);
        const divergenciaDinheiro = Math.abs(Number(f.dinheiro || 0) - dinheiroMov);

        const cieloDia = cieloMap.get(dia);
        const cieloBruto = Number(cieloDia?.bruto || 0);
        const cieloLiquido = Number(cieloDia?.liquido || 0);
        const cieloTaxa = Number(cieloDia?.taxa || 0);
        const diffCartaoXCieloBruto = Math.abs(Number(f.cartoes || 0) - cieloBruto);
        const diffCartaoXCieloLiquido = Math.abs(Number(f.cartoes || 0) - cieloLiquido);

        const sessaoId = String(movsDoDia.find((m) => m.caixa_sessao_id)?.caixa_sessao_id || "");
        const sessaoEncontrada = sessoesMap.get(sessaoId) || sessao || null;

        return {
          key: `${dia}-${f.id}`,
          dia,
          fechamento: f,
          entradasFechamento: calcEntradas(f),
          saidasFechamento: calcSaidas(f),
          saldoFechamento: calcSaldo(f),
          movs: movsDoDia,
          dinheiroMov,
          cartaoMov,
          pixMov,
          entradasMov,
          saidasMov,
          divergenciaCartao,
          divergenciaPix,
          divergenciaDinheiro,
          temDivergencia:
            divergenciaCartao > 0.009 || divergenciaPix > 0.009 || divergenciaDinheiro > 0.009,
          sessaoId,
          sessaoLabel: sessaoId ? String(sessaoId).slice(0, 8) : "—",
          operador: sessaoEncontrada?.operador || "—",
          turno: sessaoEncontrada?.turno || "—",
          cieloBruto,
          cieloLiquido,
          cieloTaxa,
          cieloVendas: Number(cieloDia?.vendas || 0),
          diffCartaoXCieloBruto,
          diffCartaoXCieloLiquido,
        };
      })
      .sort((a, b) => String(b.fechamento.data || "").localeCompare(String(a.fechamento.data || "")));
  }, [fechamentos, movimentacoes, sessoesMap, cieloMap, sessaoSelecionada]);

  const diasDisponiveis = useMemo(() => Array.from(new Set(resumidos.map((d) => d.dia))), [resumidos]);

  const sessoesDisponiveis = useMemo(() => {
    const unicos = Array.from(new Set(movimentacoes.map((m) => String(m.caixa_sessao_id || "")).filter(Boolean)));
    return unicos.map((id) => {
      const s = sessoesMap.get(id);
      return { id, label: `${String(id).slice(0, 8)}${s?.operador ? ` • ${s.operador}` : ""}${s?.turno ? ` • ${s.turno}` : ""}` };
    });
  }, [movimentacoes, sessoesMap]);

  const diasFiltrados = useMemo(() => {
    return resumidos.filter((item) => {
      if (diaSelecionado && item.dia !== diaSelecionado) return false;
      if (sessaoSelecionada && item.sessaoId !== sessaoSelecionada) return false;
      if (somenteComDivergencia && !item.temDivergencia) return false;
      if (busca) {
        const texto = JSON.stringify({ ...item.fechamento, operador: item.operador, turno: item.turno }).toLowerCase();
        if (!texto.includes(busca.toLowerCase())) return false;
      }
      return true;
    });
  }, [resumidos, diaSelecionado, sessaoSelecionada, somenteComDivergencia, busca]);

  const detalheDia = useMemo(() => diasFiltrados[0] || null, [diasFiltrados]);

  const movimentacoesDia = useMemo(() => {
    if (!detalheDia) return movimentacoesFiltradas;
    return movimentacoesFiltradas.filter((m) => getDiaKey(m.data) === detalheDia.dia);
  }, [movimentacoesFiltradas, detalheDia]);

  const resumoGeral = useMemo(() => {
    const vendaTotal = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.venda_total || 0), 0);
    const dinheiro = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.dinheiro || 0), 0);
    const cartoes = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.cartoes || 0), 0);
    const pix = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.pix_cnpj || 0) + Number(d.fechamento.pix_qr || 0), 0);
    const despesas = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.despesas || 0), 0);
    const sangrias = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.sangrias || 0), 0);
    const boletos = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.boletos || 0), 0);
    const compras = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.compras || 0), 0);
    const saldo = diasFiltrados.reduce((t, d) => t + d.saldoFechamento, 0);
    const recebFiado = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.receb_fiado || 0), 0);
    const vendaFiado = diasFiltrados.reduce((t, d) => t + Number(d.fechamento.venda_fiado || 0), 0);
    const cieloBruto = diasFiltrados.reduce((t, d) => t + Number(d.cieloBruto || 0), 0);
    const cieloLiquido = diasFiltrados.reduce((t, d) => t + Number(d.cieloLiquido || 0), 0);

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
      cieloBruto,
      cieloLiquido,
    };
  }, [diasFiltrados]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">📄 Fechamentos do Caixa</h1>
            <p className="text-sm text-gray-600">Painel completo por fechamento, com sessão, operador, turno e comparação com extrato da Cielo.</p>
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

            <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar descrição, operador, valor..." className="border p-2 rounded-lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            <select value={diaSelecionado} onChange={(e) => setDiaSelecionado(e.target.value)} className="border p-2 rounded-lg">
              <option value="">Todos os dias</option>
              {diasDisponiveis.map((dia) => (
                <option key={dia} value={dia}>{formatDateBR(dia)}</option>
              ))}
            </select>

            <select value={sessaoSelecionada} onChange={(e) => setSessaoSelecionada(e.target.value)} className="border p-2 rounded-lg">
              <option value="">Todas as sessões</option>
              {sessoesDisponiveis.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50">
              <input type="checkbox" checked={somenteComDivergencia} onChange={(e) => setSomenteComDivergencia(e.target.checked)} />
              <span className="text-sm text-gray-700">Só dias com divergência</span>
            </label>

            <div className="flex gap-3">
              <button onClick={() => carregarRelatorios()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">Filtrar</button>
              <button onClick={limparFiltros} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold">Limpar</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
            <div>
              <h2 className="font-bold text-lg text-blue-700">📥 Extrato Cielo CSV</h2>
              <p className="text-sm text-gray-600">Importe o CSV baixado da Cielo para comparar cartão do sistema com bruto e líquido por dia.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer">
                Importar CSV Cielo
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onArquivoCielo(e.target.files?.[0] || null)} />
              </label>
              <button onClick={exportarFechamentosCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold">
                Exportar fechamentos CSV
              </button>
              <button onClick={exportarMovimentacoesCSV} className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-semibold">
                Exportar mov. CSV
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <CardResumo titulo="Cielo Bruto" valor={resumoGeral.cieloBruto} cor="green" subtitulo={nomeArquivoCielo || "Sem arquivo importado"} />
            <CardResumo titulo="Cielo Líquido" valor={resumoGeral.cieloLiquido} cor="green" />
            <CardResumo titulo="Cartões Sistema" valor={resumoGeral.cartoes} cor="blue" />
            <CardResumo titulo="Dif. Cartão x Cielo Líq" valor={Math.abs(resumoGeral.cartoes - resumoGeral.cieloLiquido)} cor="red" />
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
          <CardResumo titulo="Fechamentos" valor={diasFiltrados.length} subtitulo="Quantidade listada" />
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-blue-700">📘 Fechamentos Individuais</h2>
            <span className="text-xs text-gray-500">{diasFiltrados.length} registro(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-blue-100 text-blue-800">
                <tr>
                  <th className="p-2 border">Data</th>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Hora</th>
                  <th className="p-2 border">Operador</th>
                  <th className="p-2 border">Turno</th>
                  <th className="p-2 border">Sessão</th>
                  <th className="p-2 border">Venda Total</th>
                  <th className="p-2 border">Dinheiro</th>
                  <th className="p-2 border">Cartões</th>
                  <th className="p-2 border">Pix</th>
                  <th className="p-2 border">Despesas</th>
                  <th className="p-2 border">Saldo</th>
                  <th className="p-2 border">Cielo Líq</th>
                  <th className="p-2 border">Dif. Cielo</th>
                  <th className="p-2 border">Divergência</th>
                  <th className="p-2 border">Ação</th>
                </tr>
              </thead>
              <tbody>
                {diasFiltrados.map((item) => {
                  const pixDia = Number(item.fechamento.pix_cnpj || 0) + Number(item.fechamento.pix_qr || 0);
                  const aberto = !!expandido[item.key];
                  return (
                    <>
                      <tr key={item.key} className="hover:bg-gray-50">
                        <td className="p-2 border text-center">{formatDateBR(item.dia)}</td>
                        <td className="p-2 border text-center font-mono text-xs">{String(item.fechamento.id).slice(0, 8)}</td>
                        <td className="p-2 border text-center">{formatDateTimeBR(item.fechamento.data).split(", ")[1] || "—"}</td>
                        <td className="p-2 border text-center">{item.operador}</td>
                        <td className="p-2 border text-center">{item.turno}</td>
                        <td className="p-2 border text-center font-mono text-xs">{item.sessaoLabel}</td>
                        <td className="p-2 border text-right">R$ {fmt(item.fechamento.venda_total)}</td>
                        <td className="p-2 border text-right">R$ {fmt(item.fechamento.dinheiro)}</td>
                        <td className="p-2 border text-right text-green-700 font-semibold">R$ {fmt(item.fechamento.cartoes)}</td>
                        <td className="p-2 border text-right text-green-700 font-semibold">R$ {fmt(pixDia)}</td>
                        <td className="p-2 border text-right text-red-700">R$ {fmt(item.fechamento.despesas)}</td>
                        <td className={`p-2 border text-right font-bold ${item.saldoFechamento >= 0 ? "text-green-700" : "text-red-700"}`}>R$ {fmt(item.saldoFechamento)}</td>
                        <td className="p-2 border text-right">R$ {fmt(item.cieloLiquido)}</td>
                        <td className={`p-2 border text-right font-semibold ${item.diffCartaoXCieloLiquido > 0.009 ? "text-red-700" : "text-green-700"}`}>R$ {fmt(item.diffCartaoXCieloLiquido)}</td>
                        <td className="p-2 border text-center">{item.temDivergencia ? <span className="text-red-700 font-semibold">Sim</span> : <span className="text-green-700 font-semibold">OK</span>}</td>
                        <td className="p-2 border text-center">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => setDiaSelecionado(item.dia)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold">Selecionar</button>
                            <button onClick={() => setExpandido((prev) => ({ ...prev, [item.key]: !prev[item.key] }))} className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1 rounded text-xs font-semibold">{aberto ? "Ocultar" : "Expandir"}</button>
                          </div>
                        </td>
                      </tr>
                      {aberto && (
                        <tr key={`${item.key}-detail`}>
                          <td colSpan={16} className="border bg-slate-50 p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                              <div className="bg-white rounded-lg border p-3">
                                <p className="font-bold text-blue-700 mb-2">Entradas</p>
                                <LinhaMini label="Dinheiro" valor={Number(item.fechamento.dinheiro || 0)} cor="text-green-700" />
                                <LinhaMini label="Pix CNPJ" valor={Number(item.fechamento.pix_cnpj || 0)} cor="text-green-700" />
                                <LinhaMini label="Pix QR" valor={Number(item.fechamento.pix_qr || 0)} cor="text-green-700" />
                                <LinhaMini label="Cartões" valor={Number(item.fechamento.cartoes || 0)} cor="text-green-700" />
                                <LinhaMini label="Receb. Fiado" valor={Number(item.fechamento.receb_fiado || 0)} cor="text-orange-700" />
                              </div>
                              <div className="bg-white rounded-lg border p-3">
                                <p className="font-bold text-blue-700 mb-2">Saídas</p>
                                <LinhaMini label="Sangrias" valor={Number(item.fechamento.sangrias || 0)} cor="text-red-700" />
                                <LinhaMini label="Despesas" valor={Number(item.fechamento.despesas || 0)} cor="text-red-700" />
                                <LinhaMini label="Boletos" valor={Number(item.fechamento.boletos || 0)} cor="text-red-700" />
                                <LinhaMini label="Compras" valor={Number(item.fechamento.compras || 0)} cor="text-red-700" />
                              </div>
                              <div className="bg-white rounded-lg border p-3">
                                <p className="font-bold text-blue-700 mb-2">Conferência</p>
                                <LinhaMini label="Mov. Dinheiro" valor={item.dinheiroMov} cor="text-green-700" />
                                <LinhaMini label="Mov. Cartão" valor={item.cartaoMov} cor="text-green-700" />
                                <LinhaMini label="Mov. Pix" valor={item.pixMov} cor="text-green-700" />
                                <LinhaMini label="Dif. dinheiro" valor={item.divergenciaDinheiro} cor={item.divergenciaDinheiro > 0.009 ? "text-red-700" : "text-green-700"} />
                                <LinhaMini label="Dif. cartão" valor={item.divergenciaCartao} cor={item.divergenciaCartao > 0.009 ? "text-red-700" : "text-green-700"} />
                                <LinhaMini label="Dif. pix" valor={item.divergenciaPix} cor={item.divergenciaPix > 0.009 ? "text-red-700" : "text-green-700"} />
                              </div>
                              <div className="bg-white rounded-lg border p-3">
                                <p className="font-bold text-blue-700 mb-2">Cielo</p>
                                <LinhaMini label="Bruto" valor={item.cieloBruto} cor="text-green-700" />
                                <LinhaMini label="Líquido" valor={item.cieloLiquido} cor="text-green-700" />
                                <LinhaMini label="Taxa" valor={item.cieloTaxa} cor="text-red-700" />
                                <LinhaMini label="Qtd. vendas" valor={item.cieloVendas} />
                                <LinhaMini label="Dif. cartão x bruto" valor={item.diffCartaoXCieloBruto} cor={item.diffCartaoXCieloBruto > 0.009 ? "text-red-700" : "text-green-700"} />
                                <LinhaMini label="Dif. cartão x líquido" valor={item.diffCartaoXCieloLiquido} cor={item.diffCartaoXCieloLiquido > 0.009 ? "text-red-700" : "text-green-700"} />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 text-sm">
                              <div className="bg-white rounded-lg border p-3">
                                <p className="font-semibold text-gray-700 mb-1">Descrições de saída</p>
                                <p><b>Sangrias:</b> {item.fechamento.desc_sangrias || "—"}</p>
                                <p><b>Despesas:</b> {item.fechamento.desc_despesas || "—"}</p>
                                <p><b>Boletos:</b> {item.fechamento.desc_boletos || "—"}</p>
                                <p><b>Compras:</b> {item.fechamento.desc_compras || "—"}</p>
                              </div>
                              <div className="bg-white rounded-lg border p-3">
                                <p className="font-semibold text-gray-700 mb-1">Sessão do caixa</p>
                                <p><b>Operador:</b> {item.operador}</p>
                                <p><b>Turno:</b> {item.turno}</p>
                                <p><b>Sessão:</b> {item.sessaoLabel}</p>
                                <p><b>Data/hora fechamento:</b> {formatDateTimeBR(item.fechamento.data)}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                {diasFiltrados.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-gray-500" colSpan={16}>Nenhum fechamento encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {detalheDia && (
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-blue-700">💸 Movimentações do Fechamento Selecionado</h2>
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
                    <th className="p-2 border">Sessão</th>
                    <th className="p-2 border">Linha digitável</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentacoesDia.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="p-2 border text-center">{formatDateTimeBR(m.data)}</td>
                      <td className={`p-2 border text-center font-semibold ${m.tipo === "Entrada" ? "text-green-700" : "text-red-700"}`}>{m.tipo}</td>
                      <td className="p-2 border">{m.descricao || "—"}</td>
                      <td className="p-2 border text-right">R$ {fmt(m.valor)}</td>
                      <td className="p-2 border text-center">{m.forma_pagamento || "—"}</td>
                      <td className="p-2 border text-center">{m.destino_financeiro || "—"}</td>
                      <td className="p-2 border text-center font-mono text-xs">{m.caixa_sessao_id ? String(m.caixa_sessao_id).slice(0, 8) : "—"}</td>
                      <td className="p-2 border text-center font-mono text-xs">{m.linha_digitavel || "—"}</td>
                    </tr>
                  ))}
                  {movimentacoesDia.length === 0 && (
                    <tr>
                      <td className="p-4 text-center text-gray-500" colSpan={8}>Nenhuma movimentação encontrada nesse fechamento.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {carregando && <p className="text-sm text-gray-600 mt-4">Carregando fechamentos…</p>}
      </div>
    </main>
  );
}
