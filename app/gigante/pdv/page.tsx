"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Produto = {
  id: string;
  nome: string;
  preco: number;
};

export default function PDV() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [pagamento, setPagamento] = useState("pix");

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from("gigante_produtos")
        .select("*")
        .eq("ativo", true);

      setProdutos(data || []);
    }
    carregar();
  }, []);

  const filtrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  function add(produto: Produto) {
    setCarrinho((prev) => [...prev, produto]);
    setBusca("");
  }

  function remover(i: number) {
    setCarrinho(carrinho.filter((_, x) => x !== i));
  }

  const total = carrinho.reduce((acc, p) => acc + p.preco, 0);

  async function finalizarVenda() {
    if (carrinho.length === 0) return;

    // 1) cria venda
    const { data: venda, error: erroVenda } = await supabase
      .from("gigante_vendas")
      .insert({
        total,
        metodo_pagamento: pagamento.toUpperCase(),
      })
      .select()
      .single();

    if (erroVenda) {
      alert("Erro ao registrar venda.");
      console.log(erroVenda);
      return;
    }

    // 2) itens da venda
    const itens = carrinho.map((p) => ({
      venda_id: venda.id,
      produto_id: p.id,
      nome: p.nome,
      quantidade: 1,
      preco: p.preco,
    }));

    const { error: erroItens } = await supabase
      .from("gigante_venda_itens")
      .insert(itens);

    if (erroItens) {
      alert("Erro ao registrar itens da venda!");
      console.log(erroItens);
      return;
    }

    alert("Venda concluída com sucesso!");
    setCarrinho([]);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">🧾 PDV — Gigante</h1>

      {/* Campo de busca */}
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar produto..."
        className="w-full border p-3 rounded-md mb-3"
      />

      {/* Sugestões */}
      {busca.length > 0 && (
        <div className="border rounded p-2 bg-white shadow">
          {filtrados.map((p) => (
            <button
              key={p.id}
              onClick={() => add(p)}
              className="block w-full text-left p-2 hover:bg-yellow-200"
            >
              {p.nome} — R$ {p.preco}
            </button>
          ))}
        </div>
      )}

      {/* Carrinho */}
      <h2 className="text-2xl font-semibold mt-6">🛒 Carrinho</h2>

      {carrinho.map((item, i) => (
        <div key={i} className="flex justify-between p-3 bg-white rounded shadow mt-2">
          <span>{item.nome} — R$ {item.preco}</span>
          <button className="text-red-600" onClick={() => remover(i)}>X</button>
        </div>
      ))}

      <div className="text-4xl font-black mt-6">Total: R$ {total.toFixed(2)}</div>

      <select
        value={pagamento}
        onChange={(e) => setPagamento(e.target.value)}
        className="w-full border p-3 rounded mt-4"
      >
        <option value="pix">PIX</option>
        <option value="dinheiro">DINHEIRO</option>
        <option value="debito">DÉBITO</option>
        <option value="credito">CRÉDITO</option>
      </select>

      <button
        onClick={finalizarVenda}
        className="w-full bg-green-600 text-white p-4 rounded-lg mt-6 text-xl"
      >
        Finalizar Venda
      </button>
    </div>
  );
}
