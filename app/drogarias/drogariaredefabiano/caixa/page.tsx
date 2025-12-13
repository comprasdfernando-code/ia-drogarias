"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ======================================================
// 🔵 CONFIG SUPABASE
// ======================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOJA = "drogariaredefabiano";


// ======================================================
// 🔷 COMPONENTE CARD DE ACUMULADO
// ======================================================
function CardAcum({ titulo, valor, cor }: any) {
  const cores = {
    blue: "text-blue-700",
    green: "text-green-700",
    red: "text-red-700",
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 border shadow-sm text-center">
      <p className="text-sm text-gray-600">{titulo}</p>
      <p className={`font-bold text-lg ${cores[cor]}`}>R$ {valor?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
    </div>
  );
}

// ======================================================
// 🔵 COMPONENTE PRINCIPAL
// ======================================================
export default function CaixaPage() {
  const [entradas, setEntradas] = useState<any[]>([]);
  const [saidas, setSaidas] = useState<any[]>([]);
  const [boletos, setBoletos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // --- Estados fechamento diário ---
  const [dataFechamento, setDataFechamento] = useState("");
  const [vendaTotal, setVendaTotal] = useState("");
  const [dinheiroDia, setDinheiroDia] = useState("");
  const [pixCNPJ, setPixCNPJ] = useState("");
  const [pixQR, setPixQR] = useState("");
  const [cartoesDia, setCartoesDia] = useState("");
  const [sangriasDia, setSangriasDia] = useState("");
  const [despesasDia, setDespesasDia] = useState("");
  const [boletosDia, setBoletosDia] = useState("");
  const [comprasDia, setComprasDia] = useState("");

  // --- ESTADOS NOVOS DAS DESCRIÇÕES (correto) ---
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
  const [mostrarTodos, setMostrarTodos] = useState(false);


  function fmt(n: number) {
    return n?.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }

  // ======================================================
  // 🔵 USE EFFECT
  // ======================================================
  useEffect(() => {
    carregarDados();
    carregarFechamentos();
  }, []);

  // ======================================================
  // 🔵 CARREGAR MOVIMENTAÇÕES E BOLETOS
  // ======================================================
  async function carregarDados() {
    setCarregando(true);

    const { data: movs } = await supabase
      .from("movimentacoes_caixa")
      .select("*")
      .eq("loja", LOJA)
      .order("data", { ascending: false });

    const { data: bol } = await supabase
      .from("boletos_a_vencer")
      .select("*")
      .eq("loja", LOJA)
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
    const { data } = await supabase
      .from("caixa_diario")
      .select("*")
      .eq("loja", LOJA)
      .order("data", { ascending: false });

    setFechamentos(data || []);
  }

  // ======================================================
// 🔵 SALVAR FECHAMENTO DIÁRIO (AGORA COM DESCRIÇÕES)
// ======================================================
async function salvarFechamento() {
  if (!dataFechamento || !vendaTotal) {
    alert("Digite a data e o valor da venda total!");
    return;
  }

  const saldo =
    Number(vendaTotal) -
    (Number(sangriasDia) +
      Number(despesasDia) +
      Number(boletosDia) +
      Number(comprasDia));

  const { error } = await supabase.from("caixa_diario").insert({
    loja: LOJA,
    data: dataFechamento + "T12:00:00", // força meio-dia para não cair no dia anterior

    venda_total: Number(vendaTotal),
    dinheiro: Number(dinheiroDia),
    pix_cnpj: Number(pixCNPJ),
    pix_qr: Number(pixQR),
    cartoes: Number(cartoesDia),

    sangrias: Number(sangriasDia),
    despesas: Number(despesasDia),
    boletos: Number(boletosDia),
    compras: Number(comprasDia),

    // 🆕 DESCRIÇÕES INDO PRO BANCO
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
  carregarFechamentos();
}


  // ======================================================
// 🔵 ACUMULADO POR PERÍODO (CORRIGIDO, À PROVA DE ERROS)
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

  // 🔥 Garante que nenhum campo nulo quebre o cálculo
  const calc = {
    venda_total: data.reduce((t, d) => t + (d.venda_total ?? 0), 0),
    dinheiro: data.reduce((t, d) => t + (d.dinheiro ?? 0), 0),
    pix_cnpj: data.reduce((t, d) => t + (d.pix_cnpj ?? 0), 0),
    pix_qr: data.reduce((t, d) => t + (d.pix_qr ?? 0), 0),
    cartoes: data.reduce((t, d) => t + (d.cartoes ?? 0), 0),
    sangrias: data.reduce((t, d) => t + (d.sangrias ?? 0), 0),
    despesas: data.reduce((t, d) => t + (d.despesas ?? 0), 0),
    boletos: data.reduce((t, d) => t + (d.boletos ?? 0), 0),
    compras: data.reduce((t, d) => t + (d.compras ?? 0), 0),
    saldo_final: 0,
  };

  // 🔵 saldo final acumulado do período
  calc.saldo_final =
    calc.venda_total -
    (calc.sangrias + calc.despesas + calc.boletos + calc.compras);

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
      data: new Date(),
      loja: LOJA,
      linha_digitavel: linhaDigitavelMov || null,
    });

    alert("Movimentação salva!");
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
      data_vencimento: dataVencimento,
      linha_digitavel: linhaDigitavel,
      loja: LOJA,
    });

    alert("Boleto registrado!");
    carregarDados();
  }

  // ======================================================
  // 🔵 MARCAR BOLETO COMO PAGO
  // ======================================================
  async function marcarComoPago(boleto: any) {
    const { error } = await supabase
      .from("boletos_a_vencer")
      .update({
        pago: true,
        data_pagamento: new Date(),
      })
      .eq("id", boleto.id);

    if (error) {
      alert("Erro ao atualizar!");
      return;
    }

    // registra no caixa
    await supabase.from("movimentacoes_caixa").insert({
      tipo: "Saída",
      descricao: `Pagamento boleto - ${boleto.fornecedor}`,
      valor: Number(boleto.valor),
      forma_pagamento: "Boleto",
      data: new Date(),
      loja: LOJA,
    });

    alert("Boleto pago!");
    carregarDados();
  }

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

      {/* TÍTULO */}
      <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">
        💼 Caixa - Drogaria Rede Fabiano
      </h1>

      {/* ========================================================== */}
{/* FECHAMENTO DIÁRIO */}
{/* ========================================================== */}
<div className="bg-white rounded-lg shadow p-4 mb-6">
  <h2 className="font-bold text-lg text-blue-700 mb-3">📅 Fechamento Diário</h2>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

    {/* DATA */}
    <input
      type="date"
      value={dataFechamento}
      onChange={(e) => setDataFechamento(e.target.value)}
      className="border p-2 rounded"
    />

    {/* VENDA TOTAL */}
    <input
      type="number"
      placeholder="Venda total"
      value={vendaTotal}
      onChange={(e) => setVendaTotal(e.target.value)}
      className="border p-2 rounded"
    />

    {/* DINHEIRO */}
    <input
      type="number"
      placeholder="Dinheiro"
      value={dinheiroDia}
      onChange={(e) => setDinheiroDia(e.target.value)}
      className="border p-2 rounded"
    />

    {/* PIX CNPJ */}
    <input
      type="number"
      placeholder="Pix CNPJ"
      value={pixCNPJ}
      onChange={(e) => setPixCNPJ(e.target.value)}
      className="border p-2 rounded"
    />

    {/* PIX QR */}
    <input
      type="number"
      placeholder="Pix QR"
      value={pixQR}
      onChange={(e) => setPixQR(e.target.value)}
      className="border p-2 rounded"
    />

    {/* CARTÕES */}
    <input
      type="number"
      placeholder="Cartões"
      value={cartoesDia}
      onChange={(e) => setCartoesDia(e.target.value)}
      className="border p-2 rounded"
    />

    {/* SANGRIAS */}
<input
  type="number"
  placeholder="Sangrias"
  value={sangriasDia}
  onChange={(e) => setSangriasDia(e.target.value)}
  className="border p-2 rounded"
/>

{/* DESCRIÇÃO SANGRIAS */}
<input
  type="text"
  placeholder="Descrição das sangrias"
  value={descSangrias}
  onChange={(e) => setDescSangrias(e.target.value)}
  className="border p-2 rounded col-span-2"
/>

{/* DESPESAS */}
<input
  type="number"
  placeholder="Despesas"
  value={despesasDia}
  onChange={(e) => setDespesasDia(e.target.value)}
  className="border p-2 rounded"
/>

{/* DESCRIÇÃO DESPESAS */}
<input
  type="text"
  placeholder="Descrição das despesas"
  value={descDespesas}
  onChange={(e) => setDescDespesas(e.target.value)}
  className="border p-2 rounded col-span-2"
/>

{/* BOLETOS PAGOS */}
<input
  type="number"
  placeholder="Boletos pagos"
  value={boletosDia}
  onChange={(e) => setBoletosDia(e.target.value)}
  className="border p-2 rounded"
/>

{/* DESCRIÇÃO BOLETOS PAGOS */}
<input
  type="text"
  placeholder="Descrição dos boletos pagos"
  value={descBoletosPagos}
  onChange={(e) => setDescBoletosPagos(e.target.value)}
  className="border p-2 rounded col-span-2"
/>

{/* COMPRAS */}
<input
  type="number"
  placeholder="Compras"
  value={comprasDia}
  onChange={(e) => setComprasDia(e.target.value)}
  className="border p-2 rounded"
/>

{/* DESCRIÇÃO COMPRAS */}
<input
  type="text"
  placeholder="Descrição das compras"
  value={descCompras}
  onChange={(e) => setDescCompras(e.target.value)}
  className="border p-2 rounded col-span-2"
/>


  </div>

  <button
    onClick={salvarFechamento}
    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold"
  >
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
            <CardAcum titulo="Dinheiro" valor={acumulado.dinheiro} cor="green" />
            <CardAcum titulo="Pix CNPJ" valor={acumulado.pix_cnpj} cor="green" />
            <CardAcum titulo="Pix QR" valor={acumulado.pix_qr} cor="green" />
            <CardAcum titulo="Cartões" valor={acumulado.cartoes} cor="green" />
            <CardAcum titulo="Sangrias" valor={acumulado.sangrias} cor="red" />
            <CardAcum titulo="Despesas" valor={acumulado.despesas} cor="red" />
            <CardAcum titulo="Boletos" valor={acumulado.boletos} cor="red" />
            <CardAcum titulo="Compras" valor={acumulado.compras} cor="red" />
            <CardAcum titulo="Saldo Final" valor={acumulado.saldo_final} cor="blue" />
          </div>
        )}
      </div>

      {/* ===================================================== */}
{/* 🟦 TABELA DE FECHAMENTOS DIÁRIOS — MODO B COM TOOLTIP */}
{/* ===================================================== */}

<div className="bg-white rounded-lg shadow p-4 mb-6">
  <h2 className="font-bold text-lg text-blue-700 mb-3">📘 Fechamentos Diários</h2>

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
          <th className="p-2 border">Sangrias</th>
          <th className="p-2 border">Despesas</th>
          <th className="p-2 border">Boletos</th>
          <th className="p-2 border">Compras</th>
          <th className="p-2 border">Saldo</th>
        </tr>
      </thead>

      <tbody>
        {fechamentos.map((f) => {
          const entradas =
            Number(f.dinheiro || 0) +
            Number(f.pix_cnpj || 0) +
            Number(f.pix_qr || 0) +
            Number(f.cartoes || 0);

          const saidas =
            Number(f.sangrias || 0) +
            Number(f.despesas || 0) +
            Number(f.boletos || 0) +
            Number(f.compras || 0);

          const saldo = entradas - saidas;

          return (
            <tr key={f.id} className="border hover:bg-gray-50">
              <td className="p-2 border text-center">
                {new Date(f.data).toLocaleDateString("pt-BR")}
              </td>

              <td className="p-2 border text-right">R$ {fmt(f.venda_total)}</td>

              {/* ENTRADAS */}
              <td className="p-2 border text-right font-semibold text-green-700">
                R$ {fmt(entradas)}
              </td>

              <td className="p-2 border text-right">R$ {fmt(f.dinheiro)}</td>
              <td className="p-2 border text-right">R$ {fmt(f.pix_cnpj)}</td>
              <td className="p-2 border text-right">R$ {fmt(f.pix_qr)}</td>
              <td className="p-2 border text-right">R$ {fmt(f.cartoes)}</td>

              {/* SANGRIAS + TOOLTIP */}
              <td className="p-2 border text-right relative group cursor-pointer">
                <span>R$ {fmt(f.sangrias)}</span>
                {f.desc_sangrias && (
                  <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                    {f.desc_sangrias}
                  </div>
                )}
              </td>

              {/* DESPESAS + TOOLTIP */}
              <td className="p-2 border text-right relative group cursor-pointer">
                <span>R$ {fmt(f.despesas)}</span>
                {f.desc_despesas && (
                  <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                    {f.desc_despesas}
                  </div>
                )}
              </td>

              {/* BOLETOS + TOOLTIP */}
              <td className="p-2 border text-right relative group cursor-pointer">
                <span>R$ {fmt(f.boletos)}</span>
                {f.desc_boletos && (
                  <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                    {f.desc_boletos}
                  </div>
                )}
              </td>

              {/* COMPRAS + TOOLTIP */}
              <td className="p-2 border text-right relative group cursor-pointer">
                <span>R$ {fmt(f.compras)}</span>
                {f.desc_compras && (
                  <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                    {f.desc_compras}
                  </div>
                )}
              </td>

              {/* SALDO FINAL */}
              <td
                className={
                  "p-2 border text-right font-bold " +
                  (saldo >= 0 ? "text-green-700" : "text-red-700")
                }
              >
                R$ {fmt(saldo)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>



      {/* ========================================================== */}
      {/* RESUMO DE ENTRADAS */}
      {/* ========================================================== */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold text-lg mb-3 text-blue-700">📊 Entradas</h2>

        {entradas.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma entrada registrada.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {["Dinheiro", "Pix", "Cartão", "Boleto", "Fiado"].map((forma) => {
              const total = entradas
                .filter((e) => e.forma_pagamento === forma)
                .reduce((a, i) => a + i.valor, 0);

              return (
                <CardAcum key={forma} titulo={forma} valor={total} cor="green" />
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* RESUMO DE SAÍDAS */}
      {/* ========================================================== */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold text-lg mb-3 text-red-700">💸 Saídas</h2>

        {saidas.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma saída registrada.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {["Despesas", "Compras", "Sangrias", "Boletos", "Outros"].map((tipo) => {
              const total = saidas
                .filter((s) => s.descricao?.toLowerCase().includes(tipo.toLowerCase()))
                .reduce((a, i) => a + i.valor, 0);

              return (
                <CardAcum key={tipo} titulo={tipo} valor={total} cor="red" />
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* FORMULÁRIO MOVIMENTAÇÃO */}
      {/* ========================================================== */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold text-lg mb-3 text-blue-700">➕ Nova Movimentação</h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">

          <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="border p-2 rounded">
            <option>Entrada</option>
            <option>Saída</option>
          </select>

          <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição" className="border p-2 rounded" />

          <input type="text" value={linhaDigitavelMov} onChange={(e) => setLinhaDigitavelMov(e.target.value)} placeholder="Linha digitável (opcional)" className="border p-2 rounded" />

          <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor" className="border p-2 rounded" />

          <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="border p-2 rounded">
            <option>Dinheiro</option>
            <option>Pix</option>
            <option>Cartão</option>
            <option>Boleto</option>
            <option>Fiado</option>
          </select>
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
      {/* TABELA DE BOLETOS */}
      {/* ========================================================== */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold text-blue-700 mb-3">📑 Boletos a Vencer</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-blue-100 text-blue-700">
              <tr>
                <th className="p-2 border">Fornecedor</th>
                <th className="p-2 border">Descrição</th>
                <th className="p-2 border">Valor</th>
                <th className="p-2 border">Vencimento</th>
                <th className="p-2 border">Linha Digitável</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>

            <tbody>
              {boletos.map((b) => (
                <tr key={b.id} className="border hover:bg-gray-50">

                  <td className="p-2 border">{b.fornecedor}</td>
                  <td className="p-2 border">{b.descricao}</td>
                  <td className="p-2 border text-right">R$ {fmt(b.valor)}</td>

                  <td className="p-2 border text-center">
                    {new Date(b.data_vencimento).toLocaleDateString("pt-BR")}
                  </td>

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
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================== */}
      {/* SALDO FINAL */}
      {/* ========================================================== */}
      <div className="mt-8 bg-white p-4 rounded-lg shadow text-center">
        <h3 className="text-xl font-bold">
          💵 Saldo Atual:{" "}
          <span className={saldo >= 0 ? "text-green-700" : "text-red-700"}>
            R$ {fmt(saldo)}
          </span>
        </h3>
      </div>

    </main>
  );
}