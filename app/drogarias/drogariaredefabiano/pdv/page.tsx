"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PDVPage() {
  const [busca, setBusca] = useState("");
  const [venda, setVenda] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  // 🔍 Busca produto e adiciona ao dar ENTER
  async function buscarProduto(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !busca.trim()) return;

    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .or(`nome.ilike.%${busca}%,codigo_barras.ilike.%${busca}%`)
      .limit(1);

    if (error) {
      alert("Erro ao buscar produto!");
      console.error(error);
      return;
    }

    if (data && data.length > 0) {
      const produto = data[0];
      adicionarProduto(produto);
      setBusca("");
    } else {
      alert("Produto não encontrado!");
    }
  }

  function adicionarProduto(produto: any) {
    const existente = venda.find((p) => p.id === produto.id);
    let novaVenda;

    if (existente) {
      novaVenda = venda.map((p) =>
        p.id === produto.id ? { ...p, qtd: p.qtd + 1 } : p
      );
    } else {
      novaVenda = [
        ...venda,
        { ...produto, qtd: 1, desconto: 0, preco_desc: produto.preco_venda },
      ];
    }

    setVenda(novaVenda);
    calcularTotal(novaVenda);
  }

  function calcularTotal(lista: any[]) {
    const soma = lista.reduce(
      (acc, p) => acc + p.qtd * (p.preco_venda - p.preco_venda * (p.desconto / 100)),
      0
    );
    setTotal(soma);
  }

  function alterarQtd(id: number, delta: number) {
    const novaVenda = venda
      .map((p) =>
        p.id === id
          ? { ...p, qtd: Math.max(1, p.qtd + delta) }
          : p
      )
      .filter((p) => p.qtd > 0);
    setVenda(novaVenda);
    calcularTotal(novaVenda);
  }

  function alterarDesconto(id: number, valor: number) {
    const novaVenda = venda.map((p) =>
      p.id === id
        ? { ...p, desconto: valor, preco_desc: p.preco_venda - p.preco_venda * (valor / 100) }
        : p
    );
    setVenda(novaVenda);
    calcularTotal(novaVenda);
  }

  function limparVenda() {
    setVenda([]);
    setTotal(0);
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">
        💻 PDV — Drogaria Rede Fabiano
      </h1>

      <input
        type="text"
        placeholder="Digite o nome ou código de barras..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onKeyDown={buscarProduto}
        className="w-full border p-2 rounded-md mb-4 text-lg"
      />

      {/* Cabeçalho da tabela */}
      <table className="w-full border-collapse border text-sm">
        <thead className="bg-blue-50 border-b text-gray-700">
          <tr>
            <th className="border p-2 text-left">Código</th>
            <th className="border p-2 text-left">Descrição</th>
            <th className="border p-2 w-20">Qtde</th>
            <th className="border p-2 w-24">% Desc</th>
            <th className="border p-2 w-24">Pr. Venda</th>
            <th className="border p-2 w-24">Pr. Desc</th>
            <th className="border p-2 w-24">Pr. Total</th>
          </tr>
        </thead>
        <tbody>
          {venda.map((p) => (
            <tr key={p.id} className="text-center border-b hover:bg-blue-50">
              <td className="border p-2">{p.id}</td>
              <td className="border p-2 text-left">{p.nome}</td>
              <td className="border p-2">
                <button
                  onClick={() => alterarQtd(p.id, -1)}
                  className="px-2 bg-gray-300 rounded"
                >
                  -
                </button>
                <span className="px-2">{p.qtd}</span>
                <button
                  onClick={() => alterarQtd(p.id, 1)}
                  className="px-2 bg-gray-300 rounded"
                >
                  +
                </button>
              </td>
              <td className="border p-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={p.desconto}
                  onChange={(e) =>
                    alterarDesconto(p.id, Number(e.target.value))
                  }
                  className="w-16 border rounded text-center"
                />
              </td>
              <td className="border p-2">R$ {p.preco_venda.toFixed(2)}</td>
              <td className="border p-2">
                R$ {(p.preco_venda - p.preco_venda * (p.desconto / 100)).toFixed(2)}
              </td>
              <td className="border p-2 font-bold text-green-700">
                R$ {(p.qtd * (p.preco_venda - p.preco_venda * (p.desconto / 100))).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totalizador */}
      {venda.length > 0 && (
        <div className="flex justify-between items-center mt-4 border-t pt-4">
          <div className="text-gray-600 text-sm">
            Total de itens: {venda.reduce((acc, p) => acc + p.qtd, 0)}
          </div>
          <div className="text-2xl font-bold text-blue-700">
            Total: R$ {total.toFixed(2)}
          </div>
        </div>
      )}

      {/* Botões de ação */}
      {venda.length > 0 && (
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={limparVenda}
            className="bg-red-600 text-white px-5 py-2 rounded-md"
          >
            Cancelar
          </button>
          <button
            className="bg-green-600 text-white px-5 py-2 rounded-md"
          >
            Finalizar Venda (F7)
          </button>
        </div>
      )}
    </main>
  );
}