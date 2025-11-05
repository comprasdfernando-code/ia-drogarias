"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOJA = "drogariaredefabiano";

export default function RegistrarPedidoPage() {
  const [fornecedor, setFornecedor] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [produto, setProduto] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [precoCusto, setPrecoCusto] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [dataVencimento, setDataVencimento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function registrarPedido() {
    if (!fornecedor || !produto || !precoCusto || !quantidade) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    setCarregando(true);
    const custoUnit = Number(precoCusto);
    const total = custoUnit * Number(quantidade);
    const hoje = new Date();

    // 🧾 1️⃣ Inserir o pedido de compra na tabela "pedidos"
    const { data: pedidoData, error: pedidoError } = await supabase
      .from("pedidos_compras")
      .insert({
        fornecedor,
        codigo_barras: codigoBarras,
        produto,
        quantidade,
        preco_custo: custoUnit,
        total,
        forma_pagamento: formaPagamento,
        data: hoje,
        loja: LOJA,
        observacoes,
      })
      .select("id")
      .single();

    if (pedidoError) {
      console.error(pedidoError);
      alert("Erro ao salvar o pedido.");
      setCarregando(false);
      return;
    }

    // 🧮 2️⃣ Atualizar estoque e custo no produto existente (tabela 'produtos')
    const { data: existente } = await supabase
      .from("produtos")
      .select("*")
      .eq("codigo_barras", codigoBarras)
      .eq("loja", LOJA)
      .maybeSingle();

    if (existente) {
      const novoEstoque = existente.estoque + quantidade;
      const novoCusto = custoUnit; // (poderia calcular média ponderada mais pra frente)

      await supabase
        .from("produtos")
        .update({ estoque: novoEstoque, preco_custo: novoCusto })
        .eq("id", existente.id);
    } else {
      // 🧩 3️⃣ Se não existe, cria o produto
      await supabase.from("produtos").insert({
        nome: produto,
        codigo_barras: codigoBarras,
        preco_custo: custoUnit,
        preco_venda: custoUnit * 1.3, // markup automático de 30%
        estoque: quantidade,
        disponivel: true,
        loja: LOJA,
      });
    }

    // 💰 4️⃣ Registrar movimento financeiro
    if (formaPagamento === "Boleto") {
      // 🔹 Cria boleto a vencer
      await supabase.from("boletos_a_vencer").insert({
        fornecedor,
        descricao: `Compra ${produto}`,
        valor: total,
        data_vencimento: dataVencimento || hoje,
        loja: LOJA,
      });
    } else {
      // 🔹 Cria saída no caixa
      await supabase.from("movimentacoes_caixa").insert({
        tipo: "Saída",
        descricao: `Compra ${produto} - ${fornecedor}`,
        valor: total,
        forma_pagamento: formaPagamento,
        data: hoje,
        loja: LOJA,
      });
    }

    alert("✅ Pedido registrado com sucesso!");
    limparCampos();
    setCarregando(false);
  }

  function limparCampos() {
    setFornecedor("");
    setCodigoBarras("");
    setProduto("");
    setQuantidade(1);
    setPrecoCusto("");
    setValorTotal("");
    setFormaPagamento("Dinheiro");
    setDataVencimento("");
    setObservacoes("");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">
        🧾 Registrar Pedido de Compra
      </h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Fornecedor*"
            value={fornecedor}
            onChange={(e) => setFornecedor(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Código de barras"
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Produto*"
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="Quantidade*"
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            className="border rounded px-3 py-2"
          />
          <input
            type="number"
            placeholder="Preço de custo (R$)*"
            value={precoCusto}
            onChange={(e) => setPrecoCusto(e.target.value)}
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
          {formaPagamento === "Boleto" && (
            <input
              type="date"
              placeholder="Vencimento"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="border rounded px-3 py-2"
            />
          )}
        </div>

        <textarea
          placeholder="Observações"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="border rounded w-full mt-3 p-3"
          rows={3}
        ></textarea>

        <div className="text-right mt-4">
          <button
            onClick={registrarPedido}
            disabled={carregando}
            className={`px-6 py-3 rounded text-white font-semibold ${
              carregando
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {carregando ? "Salvando..." : "Salvar Pedido"}
          </button>
        </div>
      </div>
    </main>
  );
}