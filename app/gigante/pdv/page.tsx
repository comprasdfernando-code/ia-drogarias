"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Produto = {
  id: string;
  nome: string;
  preco: number;
};

export default function PDV() {
  const [listaProdutos, setListaProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<Produto[]>([]);
  const [pagamento, setPagamento] = useState("pix");

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from("gigante_produtos")
      .select("id, nome, preco")
      .eq("ativo", true);

    if (!error && data) setListaProdutos(data);
  }

  const produtosFiltrados = listaProdutos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  function addCarrinho(produto: Produto) {
    setCarrinho((prev) => [...prev, produto]);
    setBusca("");
  }

  function removerItem(i: number) {
    setCarrinho(carrinho.filter((_, index) => index !== i));
  }

  const total = carrinho.reduce((acc, item) => acc + item.preco, 0);

  async function finalizarVenda() {
    if (carrinho.length === 0) return;

    // 1) Criar venda
    const { data: venda, error: erroVenda } = await supabase
      .from("gigante_vendas")
      .insert([
        {
          metodo_pagamento: pagamento,
          total,
          origem: "PDV",
        },
      ])
      .select()
      .single();

    if (erroVenda) {
      alert("Erro ao registrar venda.");
      return;
    }

    // 2) Registrar itens
    const itens = carrinho.map((item) => ({
      venda_id: venda.id,
      produto_id: item.id,
      preco: item.preco,
      quantidade: 1,
    }));

    await supabase.from("gigante_venda_itens").insert(itens);

    alert(
      `Venda concluída!\n\nTotal: R$ ${total.toFixed(
        2
      )}\nPagamento: ${pagamento.toUpperCase()}`
    );

    setCarrinho([]);
    setPagamento("pix");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">🧾 PDV — Gigante dos Assados</h1>

      {/* Busca */}
      <input
        autoFocus
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar produto..."
        className="w-full border p-3 rounded-md mb-3 shadow"
      />

      {/* Lista de produtos */}
      {busca.length > 0 && (
        <div className="border rounded-md p-2 bg-white shadow">
          {produtosFiltrados.map((p) => (
            <button
              key={p.id}
              onClick={() => addCarrinho(p)}
              className="w-full text-left p-2 hover:bg-yellow-200 rounded-md border-b"
            >
              {p.nome} — R$ {p.preco.toFixed(2)}
            </button>
          ))}
        </div>
      )}

      {/* Carrinho */}
      <h2 className="text-2xl font-semibold mt-6">🛒 Carrinho</h2>

      {carrinho.length === 0 && <p className="text-gray-500">Nenhum item...</p>}

      <div className="space-y-2 mt-2">
        {carrinho.map((item, i) => (
          <div
            key={i}
            className="flex justify-between items-center bg-white p-3 rounded-md shadow"
          >
            <span>
              {item.nome} — R$ {item.preco.toFixed(2)}
            </span>
            <button
              onClick={() => removerItem(i)}
              className="text-red-600 font-bold"
            >
              X
            </button>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div className="text-4xl font-black mt-6">
        Total: R$ {total.toFixed(2)}
      </div>

      {/* Pagamento */}
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">💳 Forma de Pagamento</h3>

        <select
          value={pagamento}
          onChange={(e) => setPagamento(e.target.value)}
          className="border p-3 rounded-md w-full shadow"
        >
          <option value="pix">PIX</option>
          <option value="dinheiro">DINHEIRO</option>
          <option value="debito">DÉBITO</option>
          <option value="credito">CRÉDITO</option>
        </select>
      </div>

      {/* Finalizar */}
      <button
        onClick={finalizarVenda}
        disabled={carrinho.length === 0}
        className="w-full mt-6 bg-green-600 text-white p-4 rounded-lg shadow-lg text-xl font-bold disabled:bg-gray-400"
      >
        Finalizar Venda
      </button>
    </div>
  );
}
