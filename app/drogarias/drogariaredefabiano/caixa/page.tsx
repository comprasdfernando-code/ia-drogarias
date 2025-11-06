"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOJA = "drogariaredefabiano";

export default function CaixaPage() {
  const [entradas, setEntradas] = useState<any[]>([]);
  const [saidas, setSaidas] = useState<any[]>([]);
  const [boletos, setBoletos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Formulário de novas movimentações
  const [tipo, setTipo] = useState<"Entrada" | "Saída">("Entrada");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [linhaDigitavelMov, setLinhaDigitavelMov] = useState("");

  // Formulário de novo boleto
  const [fornecedor, setFornecedor] = useState("");
  const [descricaoBoleto, setDescricaoBoleto] = useState("");
  const [valorBoleto, setValorBoleto] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [linhaDigitavel, setLinhaDigitavel] = useState("");


  // Função para corrigir diferença de data UTC x horário do Brasil
function formatarDataBR(data: string | Date) {
  if (!data) return "";
  const d = new Date(data);
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset()); // Corrige UTC
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
  useEffect(() => {
    carregarDados();
  }, []);

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

  function fmt(n: number) {
    return n?.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }

  async function registrarMovimentacao() {
    if (!descricao || !valor) {
      alert("Preencha a descrição e o valor!");
      return;
    }

    await supabase.from("movimentacoes_caixa").insert({
      tipo,
      descricao,
      valor: Number(valor),
      forma_pagamento: formaPagamento,
      data: new Date(),
      loja: LOJA,
    });

    alert(`${tipo} registrada com sucesso! ✅`);
    setDescricao("");
    setValor("");
    carregarDados();
  }

  async function registrarBoleto() {
    if (!fornecedor || !valorBoleto || !dataVencimento) {
      alert("Preencha fornecedor, valor e data de vencimento!");
      return;
    }

    await supabase.from("boletos_a_vencer").insert({
  fornecedor,
  descricao: descricaoBoleto,
  valor: Number(valorBoleto),
  data_vencimento: dataVencimento,
  linha_digitavel: linhaDigitavel || null,   // << aqui
  loja: LOJA,
});

    alert("Boleto cadastrado com sucesso! 🧾");
    setFornecedor("");
setDescricaoBoleto("");
setValorBoleto("");
setDataVencimento("");
setLinhaDigitavel("");    // << aqui
carregarDados();

  }

  async function marcarComoPago(boleto: any) {
  // ✅ Atualiza boleto como pago
  const { error: erroBoleto } = await supabase
    .from("boletos_a_vencer")
    .update({
      pago: true,
      data_pagamento: new Date(),
    })
    .eq("id", boleto.id);

  if (erroBoleto) {
    console.error("Erro ao atualizar boleto:", erroBoleto);
    alert("Erro ao atualizar boleto!");
    return;
  }

  // ✅ Insere movimentação no caixa
  const { error: erroCaixa } = await supabase.from("movimentacoes_caixa").insert`({
    tipo: "Saída",
    descricao: Pagamento boleto - ${boleto.fornecedor},
    valor: Number(boleto.valor),
    forma_pagamento: "Boleto",
    data: new Date(),
    loja: LOJA,
  })`;

  if (erroCaixa) {
    console.error("Erro ao inserir no caixa:", erroCaixa);
    alert("⚠️ Erro ao registrar no caixa!");
  } else {
    alert("💸 Boleto pago e registrado no caixa com sucesso!");
    carregarDados();
  }
}
  const totalEntradas = entradas.reduce((a, i) => a + i.valor, 0);
  const totalSaidas = saidas.reduce((a, i) => a + i.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">
        💼 Caixa - Drogaria Rede Fabiano
      </h1>

      {carregando ? (
        <p className="text-center text-gray-500">Carregando dados...</p>
      ) : (
        <>

        {/* 🔢 RESUMO DE PAGAMENTOS */}
<div className="bg-white rounded-lg shadow p-4 mb-6">
  <h2 className="font-semibold text-lg mb-3 text-blue-700">
    📊 Resumo por Forma de Pagamento (Entradas)
  </h2>

  {entradas.length === 0 ? (
    <p className="text-gray-500 text-sm">Nenhuma entrada registrada ainda.</p>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {[
        "Dinheiro",
        "Pix",
        "Cartão",
        "Boleto",
        "Fiado"
      ].map((forma) => {
        const totalForma = entradas
          .filter((e) => e.forma_pagamento === forma)
          .reduce((a, i) => a + i.valor, 0);

        return (
          <div
            key={forma}
            className="bg-gray-50 rounded-lg p-3 border text-center shadow-sm"
          >
            <p className="text-sm text-gray-600">{forma}</p>
            <p className="font-bold text-green-700 text-lg">
              R$ {fmt(totalForma || 0)}
            </p>
          </div>
        );
      })}
    </div>
  )}
</div>

{/* 💸 RESUMO DE SAÍDAS */}
<div className="bg-white rounded-lg shadow p-4 mb-6">
  <h2 className="font-semibold text-lg mb-3 text-red-700">
    💸 Resumo de Saídas por Tipo
  </h2>

  {saidas.length === 0 ? (
    <p className="text-gray-500 text-sm">Nenhuma saída registrada ainda.</p>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {[
        "Despesas",
        "Compras",
        "Sangrias",
        "Boletos",
        "Outros"
      ].map((tipoSaida) => {
        // Filtra por palavras-chave encontradas na descrição
        const totalTipo = saidas
          .filter((s) =>
            s.descricao?.toLowerCase().includes(tipoSaida.toLowerCase())
          )
          .reduce((a, i) => a + i.valor, 0);

        return (
          <div
            key={tipoSaida}
            className="bg-gray-50 rounded-lg p-3 border text-center shadow-sm"
          >
            <p className="text-sm text-gray-600">{tipoSaida}</p>
            <p className="font-bold text-red-700 text-lg">
              R$ {fmt(totalTipo || 0)}
            </p>
          </div>
        );
      })}
    </div>
  )}
</div>
          {/* FORMULÁRIO DE NOVA MOVIMENTAÇÃO */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-semibold text-lg mb-3 text-blue-700">
              ➕ Nova Movimentação
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="border rounded px-3 py-2"
              >
                <option>Entrada</option>
                <option>Saída</option>
              </select>

              <input
                type="text"
                placeholder="Descrição"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="border rounded px-3 py-2"
              />
               <input
  type="text"
  placeholder="Linha digitável (opcional)"
  value={linhaDigitavelMov}
  onChange={(e) => setLinhaDigitavelMov(e.target.value)}
  className="border rounded px-3 py-2"
/>
               
              <input
  type="text"
  placeholder="Linha digitável (opcional)"
  value={linhaDigitavel}
  onChange={(e) => setLinhaDigitavel(e.target.value)}
  className="border rounded px-3 py-2"
/>

              <input
                type="number"
                placeholder="Valor"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="border rounded px-3 py-2"
              />

              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option>Dinheiro</option>
                <option>Pix</option>
                <option>Cartão</option>
                <option>Boleto</option>
                <option>Fiado</option>
              </select>
            </div>
            <button
              onClick={registrarMovimentacao}
              className="mt-3 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-semibold"
            >
              Salvar
            </button>
          </div>

          {/* FORMULÁRIO DE BOLETO */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-semibold text-lg mb-3 text-blue-700">
              🧾 Registrar Boleto a Vencer
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Fornecedor"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Descrição"
                value={descricaoBoleto}
                onChange={(e) => setDescricaoBoleto(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Valor"
                value={valorBoleto}
                onChange={(e) => setValorBoleto(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
            <button
              onClick={registrarBoleto}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold"
            >
              Registrar Boleto
            </button>
          </div>

          {/* PAINEL DE BOLETOS DETALHADO */}
          {/* BOLETOS */}
<section className="bg-white p-4 rounded-lg shadow">
  <h2 className="font-semibold text-blue-700 text-lg mb-3">
    Boletos a Vencer 🧾
  </h2>

  <div className="overflow-x-auto">
    <table className="w-full text-sm border mt-2">
      <thead className="bg-blue-100 text-blue-700 font-semibold">
  <tr>
    <th className="p-2 border">Fornecedor</th>
    <th className="p-2 border">Descrição</th>
    <th className="p-2 border">Valor (R$)</th>
    <th className="p-2 border">Vencimento</th>
    <th className="p-2 border">Linha Digitável</th> {/* nova coluna */}
    <th className="p-2 border">Status</th>
  </tr>
</thead>
      <tbody>
  {boletos
    .filter((b) => {
      const hoje = new Date();
const venc = new Date(b.data_vencimento);
return (
  venc.getDate() === hoje.getDate() &&
  venc.getMonth() === hoje.getMonth() &&
  venc.getFullYear() === hoje.getFullYear()
);
    })
    .map((b) => (
      <tr
        key={b.id}
        className={`border-t hover:bg-gray-50 transition ${
          b.pago
            ? "text-green-600"
            : new Date(b.data_vencimento) < new Date()
            ? "text-red-600"
            : "text-yellow-600"
        }`}
      >
        <td className="p-2 border">{b.fornecedor}</td>
        <td className="p-2 border">{b.descricao}</td>
        <td className="p-2 border text-right">R$ {fmt(b.valor)}</td>
        <td className="p-2 border text-center">
          {formatarDataBR(b.data_vencimento)}
        </td>
        <td className="p-2 border text-center">
          {b.pago ? (
            <span className="text-green-700 font-semibold">✅ Pago</span>
          ) : (
            <button
              onClick={() => marcarComoPago(b)}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
            >
              Marcar Pago
            </button>
          )}
        </td>
      </tr>
    ))}

  {/* BOTÃO PARA VER TODOS */}
  {boletos.filter((b) => b.data_vencimento !== new Date().toISOString().split("T")[0])
    .length > 0 && (
    <tr>
      <td colSpan={5} className="text-center py-2">
        <button
          onClick={() => setMostrarTodos(!mostrarTodos)}
          className="text-blue-700 hover:text-blue-900 font-semibold underline"
        >
          {mostrarTodos ? "⬆️ Ocultar próximos vencimentos" : "📅 Ver próximos vencimentos"}
        </button>
      </td>
    </tr>
  )}

  {/* MOSTRAR TODOS SE CLICADO */}
  {mostrarTodos &&
    boletos.map((b) => (
      <tr
        key={b.id + "-todos"}
        className={`border-t hover:bg-gray-50 transition ${
          b.pago
            ? "text-green-600"
            : new Date(b.data_vencimento) < new Date()
            ? "text-red-600"
            : "text-yellow-600"
        }`}
      >
        <td className="p-2 border">{b.fornecedor}</td>
        <td className="p-2 border">{b.descricao}</td>
        <td className="p-2 border text-right">R$ {fmt(b.valor)}</td>
        <td className="p-2 border text-center">
          {formatarDataBR(b.data_vencimento)}
        </td>
        <td className="p-2 border text-center">
          <td className="p-2 border text-center">
  {b.linha_digitavel ? (
    <div className="flex items-center justify-center gap-2">
      <span
        className="text-xs font-mono truncate max-w-[150px]"
        title={b.linha_digitavel}
      >
        {b.linha_digitavel}
      </span>
      <button
        onClick={() => {
          navigator.clipboard.writeText(b.linha_digitavel);
          alert("Linha digitável copiada ✅");
        }}
        className="text-blue-600 hover:text-blue-800 text-xs underline"
      >
        Copiar
      </button>
    </div>
  ) : (
    <span className="text-gray-400 text-xs italic">—</span>
  )}
</td>
          {b.pago ? (
            <span className="text-green-700 font-semibold">✅ Pago</span>
          ) : (
            <button
              onClick={() => marcarComoPago(b)}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
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
</section>

          {/* SALDO FINAL */}
          <div className="mt-8 bg-white p-4 rounded-lg shadow text-center">
            <h3 className="text-xl font-bold">
              💵 Saldo Atual:{" "}
              <span className={saldo >= 0 ? "text-green-700" : "text-red-700"}>
                R$ {fmt(saldo)}
              </span>
            </h3>
          </div>
        </>
      )}
    </main>
  );
}