"use client";

import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PDVPage() {
  const [busca, setBusca] = useState("");
  const [venda, setVenda] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [showPagamento, setShowPagamento] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🔍 Buscar produto
  async function buscarProduto(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !busca.trim()) return;

    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .or(`nome.ilike.%${busca}%,codigo_barras.ilike.%${busca}%`)
      .limit(10);

    if (error) {
      alert("Erro ao buscar produto!");
      console.error(error);
      return;
    }

    if (data && data.length > 0) {
      setResultados(data);
    } else {
      alert("Produto não encontrado!");
    }
  }

  // ➕ Adicionar produto
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
        {
          ...produto,
          qtd: 1,
          desconto: 0,
          preco_desc: produto.preco_venda || 0,
        },
      ];
    }

    setVenda(novaVenda);
    calcularTotal(novaVenda);
    setResultados([]);
    setBusca("");
    if (inputRef.current) inputRef.current.focus();
  }

  // 🧮 Calcular total
  function calcularTotal(lista: any[]) {
    const soma = lista.reduce(
      (acc, p) => acc + p.qtd * (p.preco_venda - p.preco_venda * (p.desconto / 100)),
      0
    );
    setTotal(soma);
  }

  // 🧾 Alterar quantidade
  function alterarQtd(id: any, delta: number) {
    const novaVenda = venda
      .map((p) =>
        p.id === id ? { ...p, qtd: Math.max(1, p.qtd + delta) } : p
      )
      .filter((p) => p.qtd > 0);
    setVenda(novaVenda);
    calcularTotal(novaVenda);
  }

  // 💸 Alterar desconto
  function alterarDesconto(id: any, valor: number) {
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

  // 💰 Pagamento e fechamento
  const [pagamento, setPagamento] = useState<any>({
    dinheiro: "",
    cartao: "",
    troco: "",
    forma: "",
    tipo: "Balcão",
  });

  function calcularTroco(valor: string) {
    const recebido = parseFloat(valor || "0");
    const troco = recebido - total;
    setPagamento((prev: any) => ({
      ...prev,
      dinheiro: valor,
      troco: troco > 0 ? troco.toFixed(2) : "0.00",
    }));
  }

  function finalizarVenda() {
    alert("💰 Venda finalizada com sucesso!");
    limparVenda();
    setShowPagamento(false);
  }

  // --- INTERFACE ---
  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">
          💻 PDV — Drogaria Rede Fabiano
        </h1>
      </div>

      <input
        ref={inputRef}
        type="text"
        placeholder="Digite o nome ou código de barras..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onKeyDown={buscarProduto}
        className="w-full border p-2 rounded-md mb-4 text-lg focus:outline-blue-600"
      />

      {/* 🔍 Resultados da busca (modo loja visual) */}
      {resultados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {resultados.map((p, idx) => (
            <div
              key={p.id}
              className="border rounded-lg bg-white shadow-sm hover:shadow-md transition cursor-pointer p-3 flex flex-col"
            >
              <img
                src={p.imagem || "/no-image.png"}
                alt={p.nome}
                className="w-full h-28 object-contain mb-2"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{p.nome}</p>
                <p className="text-sm text-gray-500">
                  Estoque:{" "}
                  <span className="font-semibold text-green-700">
                    {p.estoque || 0}
                  </span>
                </p>
                <p className="text-blue-700 font-bold text-lg">
                  R$ {Number(p.preco_venda || 0).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => adicionarProduto(p)}
                className="mt-2 bg-blue-600 text-white py-1 rounded-md hover:bg-blue-700"
              >
                ➕ Adicionar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 🧾 Tabela da venda */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border text-sm">
          <thead className="bg-blue-50 border-b text-gray-700 text-sm">
            <tr>
              <th className="border p-2 w-32">Código</th>
              <th className="border p-2 text-left w-[40%]">Descrição</th>
              <th className="border p-2 w-16">Qtde</th>
              <th className="border p-2 w-20">% Desc</th>
              <th className="border p-2 w-20">Pr. Venda</th>
              <th className="border p-2 w-20">Pr. Desc</th>
              <th className="border p-2 w-20">Pr. Total</th>
            </tr>
          </thead>
          <tbody>
            {venda.map((p, idx) => (
              <tr
                key={p.id}
                id={`produto-${idx}`}
                tabIndex={0}
                className="text-center border-b hover:bg-blue-50"
              >
                <td className="border p-2 truncate">{p.id.slice(0, 6)}...</td>
                <td className="border p-2 text-left">{p.nome}</td>
                <td className="border p-2">{p.qtd}</td>
                <td className="border p-2">{p.desconto}%</td>
                <td className="border p-2">
                  R$ {p.preco_venda?.toFixed(2) || "0.00"}
                </td>
                <td className="border p-2">
                  R${" "}
                  {(
                    p.preco_venda - p.preco_venda * (p.desconto / 100)
                  ).toFixed(2)}
                </td>
                <td className="border p-2 font-bold text-green-700">
                  R${" "}
                  {(
                    p.qtd *
                    (p.preco_venda - p.preco_venda * (p.desconto / 100))
                  ).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
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

      {/* Botões */}
      {venda.length > 0 && (
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={limparVenda}
            className="bg-red-600 text-white px-5 py-2 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={() => setShowPagamento(true)}
            className="bg-green-600 text-white px-5 py-2 rounded-md"
          >
            Finalizar Venda (F7)
          </button>
        </div>
      )}
    </main>
  );
}