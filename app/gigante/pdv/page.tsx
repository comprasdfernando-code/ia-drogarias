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
    setCarrinho([...carrinho, produto]);
    setBusca("");
  }

  function removerItem(i: number) {
    setCarrinho(carrinho.filter((_, index) => index !== i));
  }

  const total = carrinho.reduce((acc, item) => acc + item.preco, 0);

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">🧾 PDV — Gigante dos Assados</h1>

      {/* Busca */}
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar produto..."
        className="w-full border p-3 rounded-md mb-3"
      />

      {/* Lista de produtos */}
      {busca.length > 0 && (
        <div className="border rounded-md p-2 bg-white shadow">
          {produtosFiltrados.length === 0 && <p>Nenhum produto encontrado...</p>}

          {produtosFiltrados.map((p) => (
            <button
              key={p.id}
              onClick={() => addCarrinho(p)}
              className="w-full text-left px-3 py-2 hover:bg-yellow-200 rounded-md border-b"
            >
              {p.nome} — R$ {p.preco.toFixed(2)}
            </button>
          ))}
        </div>
      )}

      {/* Carrinho */}
      <h2 className="text-2xl font-semibold mt-6 mb-2">🛒 Carrinho</h2>

      {carrinho.length === 0 && <p>Nenhum item no carrinho...</p>}

      <ul className="space-y-2">
        {carrinho.map((item, i) => (
          <li
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
          </li>
        ))}
      </ul>

      {/* TOTAL */}
      <div className="text-3xl font-black mt-6">
        Total: R$ {total.toFixed(2)}
      </div>

      {/* Formas de Pagamento */}
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">💳 Forma de Pagamento</h3>

        <select
          className="border p-3 rounded-md w-full"
          value={pagamento}
          onChange={(e) => setPagamento(e.target.value)}
        >
          <option value="pix">PIX</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="debito">Cartão Débito</option>
          <option value="credito">Cartão Crédito</option>
        </select>
      </div>

      {/* Finalizar */}
      <button
        onClick={() => alert("Venda finalizada!")}
        className="w-full mt-6 bg-green-600 text-white p-4 rounded-lg shadow-lg text-xl font-bold"
      >
        Finalizar Venda
      </button>
    </div>
  );
}
