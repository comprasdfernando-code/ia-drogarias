"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PDVPage() {
  const [busca, setBusca] = useState("");
  const [venda, setVenda] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [showPagamento, setShowPagamento] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);
  const [atendente, setAtendente] = useState<string | null>(null);
  const [atendenteId, setAtendenteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();


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
        { ...produto, qtd: 1, desconto: 0, preco_desc: produto.preco_venda || 0 },
      ];
    }

    setVenda(novaVenda);
    calcularTotal(novaVenda);
    setResultados([]);
    setBusca("");
    inputRef.current?.focus();
  }

  function calcularTotal(lista: any[]) {
    const soma = lista.reduce(
      (acc, p) => acc + p.qtd * (p.preco_venda - p.preco_venda * (p.desconto / 100)),
      0
    );
    setTotal(soma);
  }

  function alterarQtd(id: any, delta: number) {
    const novaVenda = venda
      .map((p) =>
        p.id === id ? { ...p, qtd: Math.max(1, p.qtd + delta) } : p
      )
      .filter((p) => p.qtd > 0);
    setVenda(novaVenda);
    calcularTotal(novaVenda);
  }

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

  const [pagamento, setPagamento] = useState({
    dinheiro: "",
    cartao: "",
    troco: "",
  });

  function calcularTroco(valor: string) {
    const recebido = parseFloat(valor || "0");
    const troco = recebido - total;
    setPagamento((prev) => ({
      ...prev,
      dinheiro: valor,
      troco: troco > 0 ? troco.toFixed(2) : "0.00",
    }));
  }

  // 💾 Registrar venda na Supabase
  async function registrarVenda() {
    try {
      const { error } = await supabase.from("vendas").insert([
        {
          atendente_id: atendenteId,
          atendente_nome: atendente,
          origem: "Drogaria Rede Fabiano",
          produtos: venda,
          total: total,
          dinheiro: parseFloat(pagamento.dinheiro || "0"),
          cartao: parseFloat(pagamento.cartao || "0"),
          troco: parseFloat(pagamento.troco || "0"),
        },
      ]);

      if (error) {
        console.error(error);
        alert("Erro ao registrar venda!");
      } else {
        alert("✅ Venda registrada com sucesso!");
      }
    } catch (err) {
      console.error(err);
      alert("Erro inesperado ao salvar venda!");
    }
  }

  function finalizarVenda() {
    registrarVenda();
    limparVenda();
    setShowPagamento(false);
  }

  // --- INTERFACE ---
  return (
    <main className="max-w-6xl mx-auto p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-700">
          💻 PDV — Drogaria Rede Fabiano
        </h1>
        {atendente && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">
              👨‍⚕️ Atendente: <strong>{atendente}</strong>
            </span>
            <button
              
              className="text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-600 hover:text-white transition"
            >
              Trocar Usuário
            </button>
          </div>
        )}
      </div>

      {/* Campo de busca */}
      <input
        ref={inputRef}
        type="text"
        placeholder="Digite o nome ou código de barras..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onKeyDown={buscarProduto}
        className="w-full border p-2 rounded-md mb-4 text-lg focus:outline-blue-600"
      />

      {/* Lista de resultados */}
      {resultados.length > 0 && (
        <div className="border rounded bg-white shadow p-2 mb-3">
          {resultados.map((p, idx) => (
            <div
              key={p.id}
              tabIndex={idx}
              onClick={() => adicionarProduto(p)}
              onKeyDown={(e) => e.key === "Enter" && adicionarProduto(p)}
              className="cursor-pointer hover:bg-blue-100 p-2"
            >
              {p.nome}{" "}
              <span className="text-green-700 font-semibold">
                R$ {p.preco_venda?.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
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
                <td className="border p-2">
                  <input
                    type="number"
                    value={p.qtd}
                    min="1"
                    onChange={(e) =>
                      alterarQtd(p.id, Number(e.target.value) - p.qtd)
                    }
                    className="w-16 border rounded text-center focus:outline-blue-500"
                  />
                </td>
                <td className="border p-2">
                  <input
                    id={`desconto-${idx}`}
                    type="number"
                    min="0"
                    max="100"
                    value={p.desconto}
                    onChange={(e) => alterarDesconto(p.id, Number(e.target.value))}
                    className="w-16 border rounded text-center focus:outline-blue-500"
                  />
                </td>
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

      {/* Total e botões */}
      {venda.length > 0 && (
        <>
          <div className="flex justify-between items-center mt-4 border-t pt-4">
            <div className="text-gray-600 text-sm">
              Total de itens: {venda.reduce((acc, p) => acc + p.qtd, 0)}
            </div>
            <div className="text-2xl font-bold text-blue-700">
              Total: R$ {total.toFixed(2)}
            </div>
          </div>

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
        </>
      )}

      {/* Modal Pagamento */}
      {showPagamento && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-md p-6 w-[400px] shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-center text-blue-700">
              💵 Fechamento da Venda
            </h2>

            <div className="mb-3">
              <label className="block text-sm mb-1">Dinheiro (R$)</label>
              <input
                type="number"
                value={pagamento.dinheiro}
                onChange={(e) => calcularTroco(e.target.value)}
                className="w-full border rounded p-2 text-right focus:outline-blue-500"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-1">Cartão (R$)</label>
              <input
                type="number"
                value={pagamento.cartao}
                onChange={(e) =>
                  setPagamento((prev) => ({ ...prev, cartao: e.target.value }))
                }
                className="w-full border rounded p-2 text-right focus:outline-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1">Troco</label>
              <input
                readOnly
                value={`R$ ${pagamento.troco}`}
                className="w-full border rounded p-2 text-right bg-gray-100 font-bold"
              />
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setShowPagamento(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Voltar
              </button>
              <button
                onClick={finalizarVenda}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}