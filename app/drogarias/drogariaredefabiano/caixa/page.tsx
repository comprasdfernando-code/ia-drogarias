"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

// ======================================================
// 🔵 CONFIG SUPABASE
// ======================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOJA = "drogariaredefabiano";

// ✅ bucket do storage (já criado por SQL)
const BUCKET_COMPROVANTES = "comprovantes-boletos";

type CaixaSessao = {
  id: string;
  loja_slug: string;
  operador: string | null;
  turno: string | null;
  status: string;
  valor_abertura: number | null;
  valor_fechamento: number | null;
  aberto_em: string;
  fechado_em: string | null;
  observacoes: string | null;
};

// ======================================================
// 🔷 COMPONENTE CARD DE ACUMULADO
// ======================================================
function CardAcum({ titulo, valor, cor }: any) {
  const cores: any = {
    blue: "text-blue-700",
    green: "text-green-700",
    red: "text-red-700",
    orange: "text-orange-700",
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 border shadow-sm text-center">
      <p className="text-sm text-gray-600">{titulo}</p>
      <p className={`font-bold text-lg ${cores[cor] || "text-blue-700"}`}>
        R$ {Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

function mapDestinoEntrada(forma: string) {
  if (forma === "Dinheiro") return "CAIXA_DINHEIRO";

  if (
    forma === "Pix" ||
    forma === "Pix CNPJ" ||
    forma === "Pix QR" ||
    forma === "Cartão" ||
    forma === "Boleto" ||
    forma === "Receb Fiado"
  ) {
    return "CONTA_BRADESCO";
  }

  return null; // Fiado ou não definido
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

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

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
  return new Date(String(value)).toLocaleString("pt-BR");
}

// ======================================================
// 🔵 COMPONENTE PRINCIPAL
// ======================================================
export default function CaixaPage() {
  const [entradas, setEntradas] = useState<any[]>([]);
  const [saidas, setSaidas] = useState<any[]>([]);
  const [boletos, setBoletos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // ======================================================
  // 🟢 SESSÃO DE CAIXA (NOVO)
  // ======================================================
  const [caixaAtual, setCaixaAtual] = useState<CaixaSessao | null>(null);
  const [historicoCaixa, setHistoricoCaixa] = useState<CaixaSessao[]>([]);

  const [operadorCaixa, setOperadorCaixa] = useState("");
  const [turnoCaixa, setTurnoCaixa] = useState("caixa_1");
  const [valorAberturaCaixa, setValorAberturaCaixa] = useState("");
  const [obsAberturaCaixa, setObsAberturaCaixa] = useState("");

  const [valorFechamentoCaixa, setValorFechamentoCaixa] = useState("");
  const [obsFechamentoCaixa, setObsFechamentoCaixa] = useState("");

  const [abrindoCaixa, setAbrindoCaixa] = useState(false);
  const [fechandoCaixa, setFechandoCaixa] = useState(false);

  // --- Estados fechamento diário ---
  const [dataFechamento, setDataFechamento] = useState("");
  const [vendaTotal, setVendaTotal] = useState("");

  // ✅ FIADO separado
  const [vendafiado, setVendaFiado] = useState("");
  const [recebFiado, setRecebFiado] = useState("");

  const [dinheiroDia, setDinheiroDia] = useState("");
  const [pixCNPJ, setPixCNPJ] = useState("");
  const [pixQR, setPixQR] = useState("");
  const [cartoesDia, setCartoesDia] = useState("");
  const [sangriasDia, setSangriasDia] = useState("");
  const [despesasDia, setDespesasDia] = useState("");
  const [boletosDia, setBoletosDia] = useState("");
  const [comprasDia, setComprasDia] = useState("");

  // --- ESTADOS NOVOS DAS DESCRIÇÕES ---
  const [descSangrias, setDescSangrias] = useState("");
  const [descDespesas, setDescDespesas] = useState("");
  const [descBoletosPagos, setDescBoletosPagos] = useState("");
  const [descCompras, setDescCompras] = useState("");

  // --- Outras states ---
  const [fechamentos, setFechamentos] = useState<any[]>([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [acumulado, setAcumulado] = useState<any>(null);

  const [tipo, setTipo] = useState<"Entrada" | "Saída">("Entrada");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [linhaDigitavelMov, setLinhaDigitavelMov] = useState("");

  const [fornecedor, setFornecedor] = useState("");
  const [descricaoBoleto, setDescricaoBoleto] = useState("");
  const [valorBoleto, setValorBoleto] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [linhaDigitavel, setLinhaDigitavel] = useState("");

  // -----------------------------
  // 🟥 MODAL DE SAÍDA
  // -----------------------------
  const [modalSaidaAberto, setModalSaidaAberto] = useState(false);
  const [saidaDescricao, setSaidaDescricao] = useState("");
  const [saidaValor, setSaidaValor] = useState("");
  const [saidaDestino, setSaidaDestino] = useState<"CAIXA_DINHEIRO" | "CONTA_BRADESCO" | "">("");

  // -----------------------------
  // 🟨 CONSULTA BOLETOS POR PERÍODO
  // -----------------------------
  const [bolPagoIni, setBolPagoIni] = useState("");
  const [bolPagoFim, setBolPagoFim] = useState("");
  const [bolVencerIni, setBolVencerIni] = useState("");
  const [bolVencerFim, setBolVencerFim] = useState("");

  const [boletosPagosPeriodo, setBoletosPagosPeriodo] = useState<any[]>([]);
  const [boletosVencerPeriodo, setBoletosVencerPeriodo] = useState<any[]>([]);
  const [carregandoConsulta, setCarregandoConsulta] = useState(false);

  // ✅ totais da consulta
  const [totalPagosPeriodo, setTotalPagosPeriodo] = useState(0);
  const [totalVencerPeriodo, setTotalVencerPeriodo] = useState(0);

  // ======================================================
  // ✅ COMPROVANTE (NOVO) - estados
  // ======================================================
  const [modalCompAberto, setModalCompAberto] = useState(false);
  const [boletoSelecionado, setBoletoSelecionado] = useState<any>(null);
  const [arquivoComp, setArquivoComp] = useState<File | null>(null);
  const [enviandoComp, setEnviandoComp] = useState(false);

  // ======================================================
  // ✅ PAGAR BOLETO (NOVO) - abater do caixa dinheiro/banco
  // ======================================================
  const [modalPagarBoletoAberto, setModalPagarBoletoAberto] = useState(false);
  const [boletoParaPagar, setBoletoParaPagar] = useState<any>(null);
  const [destinoPagamentoBoleto, setDestinoPagamentoBoleto] = useState<"CAIXA_DINHEIRO" | "CONTA_BRADESCO">(
    "CONTA_BRADESCO"
  );
  const [pagandoBoleto, setPagandoBoleto] = useState(false);

  function fmt(n: number) {
    return Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }

  // ======================================================
  // 🔵 USE EFFECT
  // ======================================================
  useEffect(() => {
    carregarTudoInicial();
  }, []);

  async function carregarTudoInicial() {
    await Promise.all([carregarDados(), carregarFechamentos(), carregarCaixaAtual(), carregarHistoricoCaixa()]);
  }

  // ======================================================
  // 🟢 CAIXA SESSÃO (NOVO)
  // ======================================================
  async function carregarCaixaAtual() {
    const { data, error } = await supabase
      .from("caixa_sessoes")
      .select("*")
      .eq("loja_slug", LOJA)
      .eq("status", "aberto")
      .order("aberto_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro carregarCaixaAtual:", error);
      return;
    }

    setCaixaAtual((data as CaixaSessao | null) ?? null);
  }

  async function carregarHistoricoCaixa() {
    const { data, error } = await supabase
      .from("caixa_sessoes")
      .select("*")
      .eq("loja_slug", LOJA)
      .order("aberto_em", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Erro carregarHistoricoCaixa:", error);
      return;
    }

    setHistoricoCaixa((data as CaixaSessao[]) || []);
  }

  async function abrirCaixaSessao() {
    if (caixaAtual) {
      alert("Já existe um caixa aberto para esta loja.");
      return;
    }

    setAbrindoCaixa(true);

    try {
      const valorAbertura = Number(valorAberturaCaixa || 0);

      const { data, error } = await supabase
        .from("caixa_sessoes")
        .insert({
          loja_slug: LOJA,
          operador: operadorCaixa || null,
          turno: turnoCaixa || null,
          status: "aberto",
          valor_abertura: valorAbertura,
          observacoes: obsAberturaCaixa || null,
        })
        .select("*")
        .single();

      if (error) {
        console.error(error);
        alert("Erro ao abrir caixa.");
        return;
      }

      const sessao = data as CaixaSessao;

      if (valorAbertura > 0) {
        const { error: movError } = await supabase.from("movimentacoes_caixa").insert({
          tipo: "Entrada",
          descricao: "Abertura de caixa",
          valor: valorAbertura,
          forma_pagamento: "Dinheiro",
          destino_financeiro: "CAIXA_DINHEIRO",
          data: new Date(),
          loja: LOJA,
          caixa_sessao_id: sessao.id,
        });

        if (movError) {
          console.error(movError);
          alert("Caixa aberto, mas houve erro ao lançar a abertura em movimentações.");
        }
      }

      setOperadorCaixa("");
      setTurnoCaixa("caixa_1");
      setValorAberturaCaixa("");
      setObsAberturaCaixa("");

      alert("Caixa aberto com sucesso! ✔️");
      await Promise.all([carregarCaixaAtual(), carregarHistoricoCaixa(), carregarDados()]);
    } finally {
      setAbrindoCaixa(false);
    }
  }

  async function fecharCaixaSessao() {
    if (!caixaAtual) {
      alert("Não existe caixa aberto.");
      return;
    }

    const confirmar = window.confirm("Deseja realmente fechar o caixa atual?");
    if (!confirmar) return;

    setFechandoCaixa(true);

    try {
      const { error } = await supabase
        .from("caixa_sessoes")
        .update({
          status: "fechado",
          valor_fechamento: valorFechamentoCaixa ? Number(valorFechamentoCaixa) : null,
          fechado_em: new Date().toISOString(),
          observacoes: [caixaAtual.observacoes, obsFechamentoCaixa].filter(Boolean).join(" | ") || null,
        })
        .eq("id", caixaAtual.id);

      if (error) {
        console.error(error);
        alert("Erro ao fechar caixa.");
        return;
      }

      setValorFechamentoCaixa("");
      setObsFechamentoCaixa("");

      alert("Caixa fechado com sucesso! ✔️");
      await Promise.all([carregarCaixaAtual(), carregarHistoricoCaixa(), carregarDados()]);
    } finally {
      setFechandoCaixa(false);
    }
  }

  // ======================================================
  // 🔵 CARREGAR MOVIMENTAÇÕES E BOLETOS
  // ======================================================
  async function carregarDados() {
    setCarregando(true);

    const hoje = new Date();
    const ini = startOfDayISO(addDays(hoje, -7));
    const fim = endOfDayISO(addDays(hoje, 7));

    const { data: movs } = await supabase
      .from("movimentacoes_caixa")
      .select("*")
      .eq("loja", LOJA)
      .order("data", { ascending: false })
      .limit(60);

    const { data: bol } = await supabase
      .from("boletos_a_vencer")
      .select("*")
      .eq("loja", LOJA)
      .gte("data_vencimento", ini)
      .lte("data_vencimento", fim)
      .order("data_vencimento", { ascending: true });

    setEntradas(movs?.filter((m) => m.tipo === "Entrada") || []);
    setSaidas(movs?.filter((m) => m.tipo === "Saída") || []);
    setBoletos(bol || []);

    setCarregando(false);
  }

  // ======================================================
  // 🔵 CARREGAR FECHAMENTOS DIÁRIOS
  // ======================================================
  async function carregarFechamentos() {
    const hoje = new Date();
    const ini30 = startOfDayISO(addDays(hoje, -30));

    const { data } = await supabase
      .from("caixa_diario")
      .select("*")
      .eq("loja", LOJA)
      .gte("data", ini30)
      .order("data", { ascending: false })
      .limit(30);

    setFechamentos(data || []);
  }

  // ======================================================
  // 🔵 SALVAR FECHAMENTO DIÁRIO
  // ======================================================
  async function salvarFechamento() {
    if (!dataFechamento || !vendaTotal) {
      alert("Digite a data e o valor da venda total!");
      return;
    }

    const entradasFech =
      Number(dinheiroDia || 0) +
      Number(pixCNPJ || 0) +
      Number(pixQR || 0) +
      Number(cartoesDia || 0) +
      Number(recebFiado || 0);

    const saidasFech =
      Number(sangriasDia || 0) +
      Number(despesasDia || 0) +
      Number(boletosDia || 0) +
      Number(comprasDia || 0);

    const saldo = entradasFech - saidasFech;

    const { error } = await supabase.from("caixa_diario").insert({
      loja: LOJA,
      data: dataFechamento + "T12:00:00",

      venda_total: Number(vendaTotal || 0),

      venda_fiado: Number(vendafiado || 0),
      receb_fiado: Number(recebFiado || 0),

      dinheiro: Number(dinheiroDia || 0),
      pix_cnpj: Number(pixCNPJ || 0),
      pix_qr: Number(pixQR || 0),
      cartoes: Number(cartoesDia || 0),

      sangrias: Number(sangriasDia || 0),
      despesas: Number(despesasDia || 0),
      boletos: Number(boletosDia || 0),
      compras: Number(comprasDia || 0),

      desc_sangrias: descSangrias || null,
      desc_despesas: descDespesas || null,
      desc_boletos: descBoletosPagos || null,
      desc_compras: descCompras || null,

      saldo_dia: saldo,
    });

    if (error) {
      console.error(error);
      alert("Erro ao salvar fechamento");
      return;
    }

    alert("Fechamento salvo com sucesso! ✔️");

    setVendaTotal("");
    setDinheiroDia("");
    setVendaFiado("");
    setRecebFiado("");
    setPixCNPJ("");
    setPixQR("");
    setCartoesDia("");
    setSangriasDia("");
    setDespesasDia("");
    setBoletosDia("");
    setComprasDia("");
    setDescSangrias("");
    setDescDespesas("");
    setDescBoletosPagos("");
    setDescCompras("");

    carregarFechamentos();
  }

  // ======================================================
  // 🔵 ACUMULADO POR PERÍODO
  // ======================================================
  async function filtrarAcumulado() {
    if (!dataInicio || !dataFim) {
      alert("Selecione a data inicial e final!");
      return;
    }

    const { data, error } = await supabase
      .from("caixa_diario")
      .select("*")
      .eq("loja", LOJA)
      .gte("data", dataInicio)
      .lte("data", dataFim);

    if (error) {
      console.error("Erro ao carregar acumulado:", error);
      return;
    }

    if (!data || data.length === 0) {
      setAcumulado(null);
      alert("Nenhum fechamento encontrado no período!");
      return;
    }

    const calc: any = {
      venda_total: data.reduce((t, d) => t + (d.venda_total ?? 0), 0),

      venda_fiado: data.reduce((t, d) => t + (d.venda_fiado ?? 0), 0),
      receb_fiado: data.reduce((t, d) => t + (d.receb_fiado ?? 0), 0),

      dinheiro: data.reduce((t, d) => t + (d.dinheiro ?? 0), 0),
      pix_cnpj: data.reduce((t, d) => t + (d.pix_cnpj ?? 0), 0),
      pix_qr: data.reduce((t, d) => t + (d.pix_qr ?? 0), 0),
      cartoes: data.reduce((t, d) => t + (d.cartoes ?? 0), 0),
      sangrias: data.reduce((t, d) => t + (d.sangrias ?? 0), 0),
      despesas: data.reduce((t, d) => t + (d.despesas ?? 0), 0),
      boletos: data.reduce((t, d) => t + (d.boletos ?? 0), 0),
      compras: data.reduce((t, d) => t + (d.compras ?? 0), 0),
      saldo_final: 0,
      entradas_periodo: 0,
    };

    calc.entradas_periodo =
      calc.dinheiro + calc.pix_cnpj + calc.pix_qr + calc.cartoes + calc.receb_fiado;

    calc.saldo_final =
      calc.entradas_periodo - (calc.sangrias + calc.despesas + calc.boletos + calc.compras);

    setAcumulado(calc);
  }

  // ======================================================
  // 🔵 REGISTRAR MOVIMENTAÇÃO
  // ======================================================
  async function registrarMovimentacao() {
    if (!descricao || !valor) {
      alert("Descreva e informe o valor!");
      return;
    }

    await supabase.from("movimentacoes_caixa").insert({
      tipo,
      descricao,
      valor: Number(valor),
      forma_pagamento: formaPagamento,
      destino_financeiro: tipo === "Entrada" ? mapDestinoEntrada(formaPagamento) : null,
      data: new Date(),
      loja: LOJA,
      linha_digitavel: linhaDigitavelMov || null,
      caixa_sessao_id: caixaAtual?.id || null,
    });

    alert("Movimentação salva!");
    setDescricao("");
    setValor("");
    setLinhaDigitavelMov("");
    carregarDados();
  }

  // ======================================================
  // 🔵 REGISTRAR BOLETO
  // ======================================================
  async function registrarBoleto() {
    if (!fornecedor || !valorBoleto || !dataVencimento) {
      alert("Fornecedor, data e valor são obrigatórios");
      return;
    }

    await supabase.from("boletos_a_vencer").insert({
      fornecedor,
      descricao: descricaoBoleto,
      valor: Number(valorBoleto),
      data_vencimento: dataVencimento ? dataVencimento + "T12:00:00" : dataVencimento,
      linha_digitavel: linhaDigitavel,
      loja: LOJA,
    });

    alert("Boleto registrado!");
    setFornecedor("");
    setDescricaoBoleto("");
    setValorBoleto("");
    setDataVencimento("");
    setLinhaDigitavel("");
    carregarDados();
  }

  // ======================================================
  // ✅ PAGAR BOLETO (NOVO): abre modal p/ escolher dinheiro/banco
  // ======================================================
  function abrirModalPagarBoleto(boleto: any) {
    setBoletoParaPagar(boleto);
    setDestinoPagamentoBoleto("CONTA_BRADESCO");
    setModalPagarBoletoAberto(true);
  }

  async function confirmarPagamentoBoleto() {
    if (!boletoParaPagar) return;

    setPagandoBoleto(true);
    try {
      const { error } = await supabase
        .from("boletos_a_vencer")
        .update({
          pago: true,
          data_pagamento: new Date(),
        })
        .eq("id", boletoParaPagar.id);

      if (error) {
        console.error(error);
        alert("Erro ao atualizar!");
        return;
      }

      const forma = destinoPagamentoBoleto === "CAIXA_DINHEIRO" ? "Dinheiro" : "Conta Bancária";

      const { error: movErr } = await supabase.from("movimentacoes_caixa").insert({
        tipo: "Saída",
        descricao: `Pagamento boleto - ${boletoParaPagar.fornecedor}`,
        valor: Number(boletoParaPagar.valor),
        forma_pagamento: forma,
        destino_financeiro: destinoPagamentoBoleto,
        data: new Date(),
        loja: LOJA,
        linha_digitavel: boletoParaPagar.linha_digitavel || null,
        caixa_sessao_id: caixaAtual?.id || null,
      });

      if (movErr) {
        console.error(movErr);
        alert("Boleto marcado como pago, mas deu erro ao lançar no caixa!");
        return;
      }

      alert("Boleto pago!");
      setModalPagarBoletoAberto(false);
      setBoletoParaPagar(null);
      carregarDados();
    } finally {
      setPagandoBoleto(false);
    }
  }

  // ======================================================
  // 🔵 MARCAR BOLETO COMO PAGO
  // ======================================================
  async function marcarComoPago(boleto: any) {
    abrirModalPagarBoleto(boleto);
  }

  async function salvarSaidaModal() {
    if (!saidaDescricao || !saidaValor || !saidaDestino) {
      alert("Preencha descrição, valor e destino da saída");
      return;
    }

    const { error } = await supabase.from("movimentacoes_caixa").insert({
      tipo: "Saída",
      descricao: saidaDescricao,
      valor: Number(saidaValor),
      destino_financeiro: saidaDestino,
      forma_pagamento: saidaDestino === "CAIXA_DINHEIRO" ? "Dinheiro" : "Conta Bancária",
      data: new Date(),
      loja: LOJA,
      caixa_sessao_id: caixaAtual?.id || null,
    });

    if (error) {
      console.error(error);
      alert("Erro ao salvar saída");
      return;
    }

    setSaidaDescricao("");
    setSaidaValor("");
    setSaidaDestino("");
    setModalSaidaAberto(false);

    carregarDados();
  }

  // ======================================================
  // 🟨 CONSULTAR BOLETOS PAGOS POR PERÍODO
  // ======================================================
  async function consultarBoletosPagosPeriodo() {
    if (!bolPagoIni || !bolPagoFim) {
      alert("Selecione data inicial e final (Pagos)!");
      return;
    }
    setCarregandoConsulta(true);

    const { data, error } = await supabase
      .from("boletos_a_vencer")
      .select("*")
      .eq("loja", LOJA)
      .eq("pago", true)
      .gte("data_pagamento", startOfDayISO(new Date(bolPagoIni)))
      .lte("data_pagamento", endOfDayISO(new Date(bolPagoFim)))
      .order("data_pagamento", { ascending: false });

    setCarregandoConsulta(false);

    if (error) {
      console.error(error);
      alert("Erro ao consultar boletos pagos!");
      return;
    }

    const list = data || [];
    setBoletosPagosPeriodo(list);

    const total = list.reduce((acc: number, b: any) => acc + Number(b.valor || 0), 0);
    setTotalPagosPeriodo(total);
  }

  // ======================================================
  // 🟨 CONSULTAR BOLETOS A VENCER POR PERÍODO
  // ======================================================
  async function consultarBoletosVencerPeriodo() {
    if (!bolVencerIni || !bolVencerFim) {
      alert("Selecione data inicial e final (A vencer)!");
      return;
    }
    setCarregandoConsulta(true);

    const { data, error } = await supabase
      .from("boletos_a_vencer")
      .select("*")
      .eq("loja", LOJA)
      .eq("pago", false)
      .gte("data_vencimento", startOfDayISO(new Date(bolVencerIni)))
      .lte("data_vencimento", endOfDayISO(new Date(bolVencerFim)))
      .order("data_vencimento", { ascending: true });

    setCarregandoConsulta(false);

    if (error) {
      console.error(error);
      alert("Erro ao consultar boletos a vencer!");
      return;
    }

    const list = data || [];
    setBoletosVencerPeriodo(list);

    const total = list.reduce((acc: number, b: any) => acc + Number(b.valor || 0), 0);
    setTotalVencerPeriodo(total);
  }

  // ======================================================
  // ✅ COMPROVANTE (NOVO) - helpers
  // ======================================================
  function abrirModalComprovante(boleto: any) {
    setBoletoSelecionado(boleto);
    setArquivoComp(null);
    setModalCompAberto(true);
  }

  function getExtFromFile(file: File) {
    const name = file?.name || "";
    const parts = name.split(".");
    if (parts.length < 2) return "bin";
    return parts[parts.length - 1].toLowerCase();
  }

  function sanitizeFileName(name: string) {
    return (name || "arquivo")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 120);
  }

  async function enviarComprovante() {
    if (!boletoSelecionado) return;
    if (!arquivoComp) {
      alert("Selecione um arquivo (PDF, imagem)!");
      return;
    }

    setEnviandoComp(true);

    try {
      const safe = sanitizeFileName(arquivoComp.name);
      const ts = Date.now();
      const path = `${LOJA}/boletos/${boletoSelecionado.id}/${ts}_${safe}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET_COMPROVANTES)
        .upload(path, arquivoComp, {
          cacheControl: "3600",
          upsert: true,
          contentType: arquivoComp.type || undefined,
        });

      if (upErr) {
        console.error(upErr);
        alert("Erro ao enviar comprovante!");
        return;
      }

      const { error: updErr } = await supabase
        .from("boletos_a_vencer")
        .update({
          comprovante_path: path,
          comprovante_nome: arquivoComp.name,
          comprovante_mime: arquivoComp.type || null,
          comprovante_uploaded_at: new Date().toISOString(),
        })
        .eq("id", boletoSelecionado.id);

      if (updErr) {
        console.error(updErr);
        alert("Erro ao salvar caminho do comprovante no boleto!");
        return;
      }

      alert("Comprovante salvo! ✅");
      setModalCompAberto(false);
      setBoletoSelecionado(null);
      setArquivoComp(null);
      carregarDados();
    } finally {
      setEnviandoComp(false);
    }
  }

  async function abrirComprovante(boleto: any) {
    const path = boleto?.comprovante_path;
    if (!path) {
      alert("Sem comprovante neste boleto.");
      return;
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_COMPROVANTES)
      .createSignedUrl(path, 60 * 10);

    if (error || !data?.signedUrl) {
      console.error(error);
      alert("Não foi possível abrir o comprovante.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  // ======================================================
  // 🔵 RESUMO FINANCEIRO POR DESTINO
  // ======================================================
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

  // ======================================================
  // 🔵 SALDO DO CAIXA ATUAL
  // ======================================================
  const totalEntradas = entradas.reduce((a, i) => a + i.valor, 0);
  const totalSaidas = saidas.reduce((a, i) => a + i.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  // ======================================================
  // 🔷 INTERFACE
  // ======================================================
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      {/* ✅ MODAL PAGAR BOLETO */}
      {modalPagarBoletoAberto && boletoParaPagar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-blue-700 mb-2">🧾 Pagar Boleto</h2>
            <p className="text-xs text-gray-600 mb-4">
              Fornecedor: <strong>{boletoParaPagar.fornecedor}</strong> • Valor:{" "}
              <strong>R$ {fmt(boletoParaPagar.valor)}</strong>
            </p>

            <div className="border rounded p-3 mb-4">
              <p className="text-sm font-semibold mb-2">De onde saiu o pagamento?</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="destinoBoleto"
                    value="CAIXA_DINHEIRO"
                    checked={destinoPagamentoBoleto === "CAIXA_DINHEIRO"}
                    onChange={() => setDestinoPagamentoBoleto("CAIXA_DINHEIRO")}
                  />
                  Caixa Dinheiro
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="destinoBoleto"
                    value="CONTA_BRADESCO"
                    checked={destinoPagamentoBoleto === "CONTA_BRADESCO"}
                    onChange={() => setDestinoPagamentoBoleto("CONTA_BRADESCO")}
                  />
                  Conta Bancária
                </label>
              </div>
            </div>

            {!caixaAtual && (
              <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Sem caixa aberto no momento. O lançamento será salvo sem vínculo de sessão.
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setModalPagarBoletoAberto(false);
                  setBoletoParaPagar(null);
                }}
                className="px-4 py-2 rounded border"
                disabled={pagandoBoleto}
              >
                Cancelar
              </button>

              <button
                onClick={confirmarPagamentoBoleto}
                className="px-4 py-2 rounded bg-green-600 text-white font-semibold disabled:opacity-60"
                disabled={pagandoBoleto}
              >
                {pagandoBoleto ? "Salvando..." : "Confirmar Pagamento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL COMPROVANTE */}
      {modalCompAberto && boletoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-blue-700 mb-2">📎 Comprovante do Boleto</h2>
            <p className="text-xs text-gray-600 mb-4">
              Fornecedor: <strong>{boletoSelecionado.fornecedor}</strong> • Valor:{" "}
              <strong>R$ {fmt(boletoSelecionado.valor)}</strong>
            </p>

            <div className="space-y-3">
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setArquivoComp(e.target.files?.[0] || null)}
                className="border p-2 rounded w-full"
              />

              {boletoSelecionado.comprovante_path && (
                <button
                  onClick={() => abrirComprovante(boletoSelecionado)}
                  className="w-full bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded font-semibold"
                >
                  Ver comprovante atual
                </button>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setModalCompAberto(false);
                  setBoletoSelecionado(null);
                  setArquivoComp(null);
                }}
                className="px-4 py-2 rounded border"
                disabled={enviandoComp}
              >
                Cancelar
              </button>

              <button
                onClick={enviarComprovante}
                className="px-4 py-2 rounded bg-blue-600 text-white font-semibold disabled:opacity-60"
                disabled={enviandoComp}
              >
                {enviandoComp ? "Enviando..." : "Salvar Comprovante"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalSaidaAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-red-700 mb-4">➖ Lançar Saída</h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Descrição da saída"
                value={saidaDescricao}
                onChange={(e) => setSaidaDescricao(e.target.value)}
                className="border p-2 rounded w-full"
              />

              <input
                type="number"
                placeholder="Valor"
                value={saidaValor}
                onChange={(e) => setSaidaValor(e.target.value)}
                className="border p-2 rounded w-full"
              />

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="destino"
                    value="CAIXA_DINHEIRO"
                    checked={saidaDestino === "CAIXA_DINHEIRO"}
                    onChange={() => setSaidaDestino("CAIXA_DINHEIRO")}
                  />
                  Caixa Dinheiro
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="destino"
                    value="CONTA_BRADESCO"
                    checked={saidaDestino === "CONTA_BRADESCO"}
                    onChange={() => setSaidaDestino("CONTA_BRADESCO")}
                  />
                  Conta Bancária
                </label>
              </div>

              {!caixaAtual && (
                <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Sem caixa aberto no momento. O lançamento será salvo sem vínculo de sessão.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalSaidaAberto(false)} className="px-4 py-2 rounded border">
                Cancelar
              </button>

              <button onClick={salvarSaidaModal} className="px-4 py-2 rounded bg-red-600 text-white font-semibold">
                Salvar Saída
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TÍTULO */}
      <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">💼 Caixa - Drogaria Rede Fabiano</h1>

      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <Link
          href="/drogarias/drogariaredefabiano/caixa/relatorio"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
        >
          📄 Relatórios
        </Link>

        <Link
          href="/drogarias/drogariaredefabiano/caixa/posicao"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
        >
          📊 Posição do Caixa
        </Link>
      

        <Link
          href="/drogarias/drogariaredefabiano/caixa/fechamento"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
        >
          📄 Fechamentos
        </Link>
        </div>
      {/* ====================================================== */}
      {/* 🟢 SESSÃO DE CAIXA (NOVO) */}
      {/* ====================================================== */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-bold text-lg text-emerald-700 mb-3">🟢 Abertura / Fechamento de Caixa</h2>

        {caixaAtual ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <p>
                  <strong>Status:</strong> Aberto
                </p>
                <p>
                  <strong>Turno:</strong> {caixaAtual.turno || "—"}
                </p>
                <p>
                  <strong>Operador:</strong> {caixaAtual.operador || "—"}
                </p>
                <p>
                  <strong>Aberto em:</strong> {formatDateTimeBR(caixaAtual.aberto_em)}
                </p>
                <p>
                  <strong>Valor abertura:</strong> R$ {fmt(caixaAtual.valor_abertura || 0)}
                </p>
                <p>
                  <strong>ID sessão:</strong> {String(caixaAtual.id).slice(0, 8)}
                </p>
              </div>

              {caixaAtual.observacoes && (
                <div className="mt-3 text-sm text-gray-700">
                  <strong>Obs.:</strong> {caixaAtual.observacoes}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <input
                type="number"
                placeholder="Valor de fechamento (opcional)"
                value={valorFechamentoCaixa}
                onChange={(e) => setValorFechamentoCaixa(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Observação de fechamento"
                value={obsFechamentoCaixa}
                onChange={(e) => setObsFechamentoCaixa(e.target.value)}
                className="border p-2 rounded md:col-span-2"
              />
            </div>

            <button
              onClick={fecharCaixaSessao}
              disabled={fechandoCaixa}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded font-semibold disabled:opacity-60"
            >
              {fechandoCaixa ? "Fechando..." : "Fechar Caixa"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              Nenhum caixa aberto no momento.
            </div>

            <div className="grid md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Operador"
                value={operadorCaixa}
                onChange={(e) => setOperadorCaixa(e.target.value)}
                className="border p-2 rounded"
              />

              <select
                value={turnoCaixa}
                onChange={(e) => setTurnoCaixa(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="caixa_1">Caixa 1</option>
                <option value="caixa_2">Caixa 2</option>
                <option value="caixa_unico">Caixa Único</option>
              </select>

              <input
                type="number"
                placeholder="Valor abertura"
                value={valorAberturaCaixa}
                onChange={(e) => setValorAberturaCaixa(e.target.value)}
                className="border p-2 rounded"
              />

              <input
                type="text"
                placeholder="Observação"
                value={obsAberturaCaixa}
                onChange={(e) => setObsAberturaCaixa(e.target.value)}
                className="border p-2 rounded"
              />
            </div>

            <button
              onClick={abrirCaixaSessao}
              disabled={abrindoCaixa}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded font-semibold disabled:opacity-60"
            >
              {abrindoCaixa ? "Abrindo..." : "Abrir Caixa"}
            </button>
          </div>
        )}

        {historicoCaixa.length > 0 && (
          <div className="mt-5">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Últimas sessões</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-2 border">Turno</th>
                    <th className="p-2 border">Operador</th>
                    <th className="p-2 border">Status</th>
                    <th className="p-2 border">Abertura</th>
                    <th className="p-2 border">Fechamento</th>
                    <th className="p-2 border">Aberto em</th>
                    <th className="p-2 border">Fechado em</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoCaixa.map((cx) => (
                    <tr key={cx.id} className="border hover:bg-gray-50">
                      <td className="p-2 border text-center">{cx.turno || "—"}</td>
                      <td className="p-2 border text-center">{cx.operador || "—"}</td>
                      <td className="p-2 border text-center">{cx.status}</td>
                      <td className="p-2 border text-right">R$ {fmt(cx.valor_abertura || 0)}</td>
                      <td className="p-2 border text-right">R$ {fmt(cx.valor_fechamento || 0)}</td>
                      <td className="p-2 border text-center">{formatDateTimeBR(cx.aberto_em)}</td>
                      <td className="p-2 border text-center">{formatDateTimeBR(cx.fechado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setModalSaidaAberto(true)}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold mb-4"
      >
        ➖ Lançar Saída (Modal)
      </button>

      {/* ====================================================== */}
      {/* 💰 RESUMO POR DESTINO FINANCEIRO */}
      {/* ====================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-lg text-green-700 mb-3">💵 Caixa Dinheiro</h3>
          <div className="space-y-1 text-sm">
            <p>
              Entradas: <strong>R$ {fmt(entradasDinheiro)}</strong>
            </p>
            <p>
              Saídas: <strong className="text-red-600">R$ {fmt(saidasDinheiro)}</strong>
            </p>
            <p className="border-t pt-2 font-bold">
              Saldo:{" "}
              <span className={saldoDinheiro >= 0 ? "text-green-700" : "text-red-700"}>R$ {fmt(saldoDinheiro)}</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-lg text-blue-700 mb-3">🏦 Conta Bancária</h3>
          <div className="space-y-1 text-sm">
            <p>
              Entradas: <strong>R$ {fmt(entradasBanco)}</strong>
            </p>
            <p>
              Saídas: <strong className="text-red-600">R$ {fmt(saidasBanco)}</strong>
            </p>
            <p className="border-t pt-2 font-bold">
              Saldo: <span className={saldoBanco >= 0 ? "text-green-700" : "text-red-700"}>R$ {fmt(saldoBanco)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* FECHAMENTO DIÁRIO */}
      {/* ========================================================== */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-bold text-lg text-blue-700 mb-3">📅 Fechamento Diário</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input type="date" value={dataFechamento} onChange={(e) => setDataFechamento(e.target.value)} className="border p-2 rounded" />

          <input
            type="number"
            placeholder="Venda total"
            value={vendaTotal}
            onChange={(e) => setVendaTotal(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="number"
            placeholder="Dinheiro"
            value={dinheiroDia}
            onChange={(e) => setDinheiroDia(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="number"
            placeholder="Receb. Fiado"
            value={recebFiado}
            onChange={(e) => setRecebFiado(e.target.value)}
            className="border p-2 rounded"
          />

          <input type="number" placeholder="Pix CNPJ" value={pixCNPJ} onChange={(e) => setPixCNPJ(e.target.value)} className="border p-2 rounded" />
          <input type="number" placeholder="Pix QR" value={pixQR} onChange={(e) => setPixQR(e.target.value)} className="border p-2 rounded" />
          <input type="number" placeholder="Cartões" value={cartoesDia} onChange={(e) => setCartoesDia(e.target.value)} className="border p-2 rounded" />

          <input
            type="number"
            placeholder="Venda Fiado"
            value={vendafiado}
            onChange={(e) => setVendaFiado(e.target.value)}
            className="border p-2 rounded"
          />

          <input type="number" placeholder="Sangrias" value={sangriasDia} onChange={(e) => setSangriasDia(e.target.value)} className="border p-2 rounded" />

          <input
            type="text"
            placeholder="Descrição das sangrias"
            value={descSangrias}
            onChange={(e) => setDescSangrias(e.target.value)}
            className="border p-2 rounded col-span-2"
          />

          <input type="number" placeholder="Despesas" value={despesasDia} onChange={(e) => setDespesasDia(e.target.value)} className="border p-2 rounded" />

          <input
            type="text"
            placeholder="Descrição das despesas"
            value={descDespesas}
            onChange={(e) => setDescDespesas(e.target.value)}
            className="border p-2 rounded col-span-2"
          />

          <input type="number" placeholder="Boletos pagos" value={boletosDia} onChange={(e) => setBoletosDia(e.target.value)} className="border p-2 rounded" />

          <input
            type="text"
            placeholder="Descrição dos boletos pagos"
            value={descBoletosPagos}
            onChange={(e) => setDescBoletosPagos(e.target.value)}
            className="border p-2 rounded col-span-2"
          />

          <input type="number" placeholder="Compras" value={comprasDia} onChange={(e) => setComprasDia(e.target.value)} className="border p-2 rounded" />

          <input
            type="text"
            placeholder="Descrição das compras"
            value={descCompras}
            onChange={(e) => setDescCompras(e.target.value)}
            className="border p-2 rounded col-span-2"
          />
        </div>

        <button onClick={salvarFechamento} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold">
          Salvar Fechamento
        </button>
      </div>

      {/* ========================================================== */}
      {/* ACUMULADO */}
      {/* ========================================================== */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-bold text-lg text-blue-700 mb-3">📊 Acumulado por Período</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="border p-2 rounded" />
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="border p-2 rounded" />

          <button onClick={filtrarAcumulado} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Filtrar
          </button>
        </div>

        {acumulado && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <CardAcum titulo="Venda Total" valor={acumulado.venda_total} cor="blue" />
            <CardAcum titulo="Entradas (c/ receb fiado)" valor={acumulado.entradas_periodo} cor="green" />

            <CardAcum titulo="Dinheiro" valor={acumulado.dinheiro} cor="green" />
            <CardAcum titulo="Pix CNPJ" valor={acumulado.pix_cnpj} cor="green" />
            <CardAcum titulo="Pix QR" valor={acumulado.pix_qr} cor="green" />
            <CardAcum titulo="Cartões" valor={acumulado.cartoes} cor="green" />

            <CardAcum titulo="Receb. Fiado" valor={acumulado.receb_fiado} cor="green" />
            <CardAcum titulo="Venda Fiado" valor={acumulado.venda_fiado} cor="orange" />

            <CardAcum titulo="Sangrias" valor={acumulado.sangrias} cor="red" />
            <CardAcum titulo="Despesas" valor={acumulado.despesas} cor="red" />
            <CardAcum titulo="Boletos" valor={acumulado.boletos} cor="red" />
            <CardAcum titulo="Compras" valor={acumulado.compras} cor="red" />

            <CardAcum titulo="Saldo Final" valor={acumulado.saldo_final} cor="blue" />
          </div>
        )}
      </div>

      {/* ===================================================== */}
      {/* 🟦 TABELA DE FECHAMENTOS DIÁRIOS */}
      {/* ===================================================== */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-bold text-lg text-blue-700 mb-3">📘 Fechamentos Diários (Últimos 30 dias)</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-blue-100 text-blue-700 font-semibold">
              <tr>
                <th className="p-2 border">Data</th>
                <th className="p-2 border">Venda Total</th>
                <th className="p-2 border">Entradas</th>
                <th className="p-2 border">Dinheiro</th>
                <th className="p-2 border">Pix CNPJ</th>
                <th className="p-2 border">Pix QR</th>
                <th className="p-2 border">Cartões</th>
                <th className="p-2 border">Receb. Fiado</th>
                <th className="p-2 border">Sangrias</th>
                <th className="p-2 border">Despesas</th>
                <th className="p-2 border">Boletos</th>
                <th className="p-2 border">Compras</th>
                <th className="p-2 border">Saldo</th>
                <th className="p-2 border">Venda Fiado</th>
              </tr>
            </thead>

            <tbody>
              {fechamentos.map((f) => {
                const entradasDia =
                  Number(f.dinheiro || 0) +
                  Number(f.pix_cnpj || 0) +
                  Number(f.pix_qr || 0) +
                  Number(f.cartoes || 0) +
                  Number(f.receb_fiado || 0);

                const saidasDia =
                  Number(f.sangrias || 0) +
                  Number(f.despesas || 0) +
                  Number(f.boletos || 0) +
                  Number(f.compras || 0);

                const saldoDia = entradasDia - saidasDia;

                return (
                  <tr key={f.id} className="border hover:bg-gray-50">
                    <td className="p-2 border text-center">{formatDateBR(String(f.data).slice(0, 10))}</td>
                    <td className="p-2 border text-right">R$ {fmt(f.venda_total)}</td>

                    <td className="p-2 border text-right font-semibold text-green-700">R$ {fmt(entradasDia)}</td>

                    <td className="p-2 border text-right">R$ {fmt(f.dinheiro)}</td>
                    <td className="p-2 border text-right">R$ {fmt(f.pix_cnpj)}</td>
                    <td className="p-2 border text-right">R$ {fmt(f.pix_qr)}</td>
                    <td className="p-2 border text-right">R$ {fmt(f.cartoes)}</td>

                    <td className="p-2 border text-right font-semibold text-green-700">R$ {fmt(f.receb_fiado || 0)}</td>

                    <td className="p-2 border text-right relative group cursor-pointer">
                      <span>R$ {fmt(f.sangrias)}</span>
                      {f.desc_sangrias && (
                        <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                          {f.desc_sangrias}
                        </div>
                      )}
                    </td>

                    <td className="p-2 border text-right relative group cursor-pointer">
                      <span>R$ {fmt(f.despesas)}</span>
                      {f.desc_despesas && (
                        <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                          {f.desc_despesas}
                        </div>
                      )}
                    </td>

                    <td className="p-2 border text-right relative group cursor-pointer">
                      <span>R$ {fmt(f.boletos)}</span>
                      {f.desc_boletos && (
                        <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                          {f.desc_boletos}
                        </div>
                      )}
                    </td>

                    <td className="p-2 border text-right relative group cursor-pointer">
                      <span>R$ {fmt(f.compras)}</span>
                      {f.desc_compras && (
                        <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                          {f.desc_compras}
                        </div>
                      )}
                    </td>

                    <td className={"p-2 border text-right font-bold " + (saldoDia >= 0 ? "text-green-700" : "text-red-700")}>
                      R$ {fmt(saldoDia)}
                    </td>

                    <td className="p-2 border text-right font-semibold text-orange-700">R$ {fmt(f.venda_fiado || 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================== */}
      {/* FORMULÁRIO MOVIMENTAÇÃO */}
      {/* ========================================================== */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold text-lg mb-3 text-blue-700">➕ Nova Movimentação</h2>

        {!caixaAtual && (
          <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Sem caixa aberto no momento. A movimentação será salva sem vínculo de sessão.
          </div>
        )}

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="border p-2 rounded">
            <option>Entrada</option>
            <option>Saída</option>
          </select>

          <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição" className="border p-2 rounded" />
          <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor" className="border p-2 rounded" />

          <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="border p-2 rounded">
            <option>Dinheiro</option>
            <option>Pix</option>
            <option>Cartão</option>
            <option>Boleto</option>
            <option>Fiado</option>
          </select>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <input
            type="text"
            value={linhaDigitavelMov}
            onChange={(e) => setLinhaDigitavelMov(e.target.value)}
            placeholder="Linha digitável (opcional)"
            className="border p-2 rounded md:col-span-2"
          />
        </div>

        <button onClick={registrarMovimentacao} className="mt-3 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-semibold">
          Salvar Movimentação
        </button>
      </div>

      {/* ========================================================== */}
      {/* FORMULÁRIO DE BOLETOS */}
      {/* ========================================================== */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-bold text-blue-700 mb-3">🧾 Registrar Boleto</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="border p-2 rounded" type="text" placeholder="Fornecedor" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
          <input className="border p-2 rounded" type="text" placeholder="Descrição" value={descricaoBoleto} onChange={(e) => setDescricaoBoleto(e.target.value)} />
          <input className="border p-2 rounded" type="number" placeholder="Valor" value={valorBoleto} onChange={(e) => setValorBoleto(e.target.value)} />
          <input className="border p-2 rounded" type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
          <input className="border p-2 rounded" type="text" placeholder="Linha digitável" value={linhaDigitavel} onChange={(e) => setLinhaDigitavel(e.target.value)} />
        </div>

        <button onClick={registrarBoleto} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-bold">
          Registrar Boleto
        </button>
      </div>

      {/* ========================================================== */}
      {/* CONSULTA BOLETOS POR PERÍODO */}
      {/* ========================================================== */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-bold text-blue-700 mb-3">🔎 Consultar Boletos por Período</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border rounded p-4 bg-gray-50">
            <h3 className="font-bold text-green-700 mb-3">✅ Boletos Pagos (por data de pagamento)</h3>

            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={bolPagoIni} onChange={(e) => setBolPagoIni(e.target.value)} className="border p-2 rounded" />
              <input type="date" value={bolPagoFim} onChange={(e) => setBolPagoFim(e.target.value)} className="border p-2 rounded" />
            </div>

            <button
              onClick={consultarBoletosPagosPeriodo}
              className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
            >
              Buscar Pagos
            </button>

            <div className="mt-3 bg-white rounded border p-3 text-sm">
              <span className="text-gray-600">Total pago no período: </span>
              <strong className="text-green-700">R$ {fmt(totalPagosPeriodo)}</strong>
            </div>

            {boletosPagosPeriodo.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-green-100 text-green-800">
                    <tr>
                      <th className="p-2 border">Fornecedor</th>
                      <th className="p-2 border">Valor</th>
                      <th className="p-2 border">Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boletosPagosPeriodo.map((b) => (
                      <tr key={b.id} className="border hover:bg-white">
                        <td className="p-2 border">{b.fornecedor}</td>
                        <td className="p-2 border text-right">R$ {fmt(b.valor)}</td>
                        <td className="p-2 border text-center">{formatDateBR(b.data_pagamento)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {boletosPagosPeriodo.length === 0 && totalPagosPeriodo === 0 && (
              <p className="mt-3 text-xs text-gray-500">Sem resultados ainda (faça a busca).</p>
            )}
          </div>

          <div className="border rounded p-4 bg-gray-50">
            <h3 className="font-bold text-blue-700 mb-3">📌 Boletos a Vencer (por vencimento)</h3>

            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={bolVencerIni} onChange={(e) => setBolVencerIni(e.target.value)} className="border p-2 rounded" />
              <input type="date" value={bolVencerFim} onChange={(e) => setBolVencerFim(e.target.value)} className="border p-2 rounded" />
            </div>

            <button
              onClick={consultarBoletosVencerPeriodo}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
            >
              Buscar a Vencer
            </button>

            <div className="mt-3 bg-white rounded border p-3 text-sm">
              <span className="text-gray-600">Total a vencer no período: </span>
              <strong className="text-blue-700">R$ {fmt(totalVencerPeriodo)}</strong>
            </div>

            {boletosVencerPeriodo.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-blue-100 text-blue-700">
                    <tr>
                      <th className="p-2 border">Fornecedor</th>
                      <th className="p-2 border">Valor</th>
                      <th className="p-2 border">Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boletosVencerPeriodo.map((b) => (
                      <tr key={b.id} className="border hover:bg-white">
                        <td className="p-2 border">{b.fornecedor}</td>
                        <td className="p-2 border text-right">R$ {fmt(b.valor)}</td>
                        <td className="p-2 border text-center">{formatDateBR(b.data_vencimento)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {boletosVencerPeriodo.length === 0 && totalVencerPeriodo === 0 && (
              <p className="mt-3 text-xs text-gray-500">Sem resultados ainda (faça a busca).</p>
            )}
          </div>
        </div>

        {carregandoConsulta && <p className="mt-3 text-sm text-gray-600">Consultando…</p>}
      </div>

      {/* ========================================================== */}
      {/* TABELA DE BOLETOS */}
      {/* ========================================================== */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold text-blue-700 mb-1">📑 Boletos a Vencer</h2>
        <p className="text-xs text-gray-600 mb-3">Mostrando: últimos 7 dias e próximos 7 dias</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-blue-100 text-blue-700">
              <tr>
                <th className="p-2 border">Fornecedor</th>
                <th className="p-2 border">Descrição</th>
                <th className="p-2 border">Valor</th>
                <th className="p-2 border">Vencimento</th>
                <th className="p-2 border">Linha Digitável</th>
                <th className="p-2 border">Comprovante</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>

            <tbody>
              {boletos.map((b) => (
                <tr key={b.id} className="border hover:bg-gray-50">
                  <td className="p-2 border">{b.fornecedor}</td>
                  <td className="p-2 border">{b.descricao}</td>
                  <td className="p-2 border text-right">R$ {fmt(b.valor)}</td>

                  <td className="p-2 border text-center">{formatDateBR(b.data_vencimento)}</td>

                  <td className="p-2 border text-center">
                    {b.linha_digitavel ? (
                      <>
                        <span className="font-mono text-xs">{b.linha_digitavel}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(b.linha_digitavel)}
                          className="ml-2 text-blue-600 underline text-xs"
                        >
                          Copiar
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="p-2 border text-center">
                    {b.comprovante_path ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirComprovante(b)}
                          className="bg-slate-700 hover:bg-slate-800 text-white px-2 py-1 text-xs rounded"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => abrirModalComprovante(b)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs rounded"
                        >
                          Trocar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => abrirModalComprovante(b)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded"
                      >
                        Adicionar
                      </button>
                    )}
                  </td>

                  <td className="p-2 border text-center">
                    {b.pago ? (
                      <span className="text-green-700 font-bold">Pago ✔️</span>
                    ) : (
                      <button
                        onClick={() => marcarComoPago(b)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs rounded"
                      >
                        Marcar Pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {boletos.length === 0 && (
                <tr>
                  <td className="p-3 text-center text-sm text-gray-500" colSpan={7}>
                    Nenhum boleto na janela de -7 a +7 dias.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}