"use client";

import { useState } from "react";

type Produto = {
  id: number;
  nome: string;
  preco: number;
};

export default function PDV() {
  const listaProdutos: Produto[] = [
    { id: 1, nome: "Frango Assado", preco: 39.90 },
    { id: 2, nome: "Torresmo de Rolo", preco: 79.90 },
    { id: 3, nome: "Coxa e Sobrecoxa", preco: 19.90 },
    { id: 4, nome: "Maionese", preco: 14.90 },
    { id: 5, nome: "Farofa", preco: 9.90 },
  ];

  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<Produto[]>([]);
  const [pagamento, setPagamento] = useState("pix");

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

  function finalizarVenda() {
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
        placeholder="Buscar ou digitar produto..."
        className="w-full border p-3 rounded-md mb-3 shadow"
      />

      {/* Lista de produtos filtrados */}
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
