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

function CardResumo({
  titulo,
  valor,
  cor = "blue",
}: {
  titulo: string;
  valor: number;
  cor?: "blue" | "green" | "red" | "orange";
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
    </div>
  );
}

// 🔥 NOVO NOME DA PÁGINA
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
      const [{ data: dataFech }, { data: dataMov }] = await Promise.all([
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
          .limit(1000),
      ]);

      setFechamentos((dataFech as Fechamento[]) || []);
      setMovimentacoes((dataMov as Movimentacao[]) || []);
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
    carregarRelatorios(inicioPadrao, fimPadrao);
  }

  const fechamentosFiltrados = useMemo(() => {
    return fechamentos.filter((f) => {
      const texto = JSON.stringify(f).toLowerCase();
      return !busca || texto.includes(busca.toLowerCase());
    });
  }, [fechamentos, busca]);

  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter((m) => {
      if (tipoMov && m.tipo !== tipoMov) return false;
      if (formaMov && (m.forma_pagamento || "") !== formaMov) return false;
      if (destinoMov && (m.destino_financeiro || "") !== destinoMov) return false;
      if (busca) {
        const texto = JSON.stringify(m).toLowerCase();
        if (!texto.includes(busca.toLowerCase())) return false;
      }
      return true;
    });
  }, [movimentacoes, tipoMov, formaMov, destinoMov, busca]);

  const resumo = useMemo(() => {
    const vendaTotal = fechamentosFiltrados.reduce((t, f) => t + Number(f.venda_total || 0), 0);
    const cartoes = fechamentosFiltrados.reduce((t, f) => t + Number(f.cartoes || 0), 0);
    const pixTotal = fechamentosFiltrados.reduce((t, f) => t + Number(f.pix_cnpj || 0) + Number(f.pix_qr || 0), 0);
    const saldo = fechamentosFiltrados.reduce((t, f) => t + Number(f.saldo_dia || 0), 0);

    return { vendaTotal, cartoes, pixTotal, saldo };
  }, [fechamentosFiltrados]);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-700">📄 Fechamentos do Caixa</h1>
          <p className="text-sm text-gray-600">Análise e conferência dos fechamentos.</p>
        </div>

        <div className="bg-white p-4 rounded shadow mb-6 grid md:grid-cols-6 gap-3">
          <input type="date" value={dataIni} onChange={(e) => setDataIni(e.target.value)} />
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />

          <select onChange={(e) => setTipoMov(e.target.value)}>
            <option value="">Tipo</option>
            <option value="Entrada">Entrada</option>
            <option value="Saída">Saída</option>
          </select>

          <select onChange={(e) => setFormaMov(e.target.value)}>
            <option value="">Forma</option>
            <option>Dinheiro</option>
            <option>Pix</option>
            <option>Cartão</option>
          </select>

          <input placeholder="Buscar..." onChange={(e) => setBusca(e.target.value)} />

          <button onClick={() => carregarRelatorios()} className="bg-blue-600 text-white rounded">
            Filtrar
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <CardResumo titulo="Venda Total" valor={resumo.vendaTotal} />
          <CardResumo titulo="Cartões" valor={resumo.cartoes} cor="green" />
          <CardResumo titulo="Pix" valor={resumo.pixTotal} cor="green" />
          <CardResumo titulo="Saldo" valor={resumo.saldo} />
        </div>

      </div>
    </main>
  );
}
