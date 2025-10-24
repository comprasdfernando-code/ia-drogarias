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
        { ...produto, qtd: 1, desconto: 0, preco_desc: produto.preco_venda || 0 },
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

  // 🖨️ Impressão
  function imprimirCupom() {
    const novaJanela = window.open("", "_blank");
    if (!novaJanela) return;

    const data = new Date();
    const hora = data.toLocaleTimeString("pt-BR");
    const dia = data.toLocaleDateString("pt-BR");

    novaJanela.document.write(`
      <html>
      <head>
        <title>Cupom de Venda</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 14px; padding: 8px; color: #111; }
          h2 { text-align: center; margin-bottom: 4px; }
          .linha { border-bottom: 1px dashed #333; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          th, td { text-align: left; padding: 3px; }
          .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 5px; }
          small { font-size: 11px; color: #444; display: block; text-align: center; margin-top: 5px; }
        </style>
      </head>
      <body>
        <h2>Drogaria Rede Fabiano</h2>
        <div class="linha"></div>
        <small>Data: ${dia} - ${hora}</small>
        <div class="linha"></div>
        <table>
          <tr><th>Produto</th><th>Qtd</th><th>Preço</th></tr>
          ${venda.map(p => `
            <tr>
              <td>${p.nome}</td>
              <td>${p.qtd}</td>
              <td>R$ ${(p.qtd * p.preco_venda).toFixed(2)}</td>
            </tr>
          `).join("")}
        </table>
        <div class="linha"></div>
        <p class="total">Total: R$ ${total.toFixed(2)}</p>
        <div class="linha"></div>
        <small>Pagamento: ${pagamento.forma || "Não informado"}</small>
        <small>Tipo de Venda: ${pagamento.tipo}</small>
        ${pagamento.tipo === "Entrega" ? <small>Endereço: ${pagamento.endereco || "Não informado"}</small> : ""}
        <small>CNPJ: 62.157.257/0001-09</small>
        <small>💙 Obrigado pela preferência!</small>
      </body>
      </html>
    `);

    novaJanela.document.close();
    novaJanela.print();
  }

  // --- INTERFACE ---
  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 text-center mb-4">
        💻 PDV — Drogaria Rede Fabiano
      </h1>

      <div className="flex flex-col sm:flex-row gap-2 items-center mb-4">
        <input
          ref={inputRef}
          type="text"
          placeholder="Digite o nome ou código de barras..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={buscarProduto}
          className="w-full border p-2 rounded-md text-lg focus:outline-blue-600"
        />
        <button
          onClick={() => alert('Em breve: busca por clique')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold"
        >
          🔍 Buscar
        </button>
      </div>

      {resultados.length > 0 && (
        <div className="border rounded bg-white shadow p-2 mb-3">
          {resultados.map((p, idx) => (
            <div
              key={p.id}
              onClick={() => adicionarProduto(p)}
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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border text-xs sm:text-sm">
          <thead className="bg-blue-50 border-b text-gray-700">
            <tr>
              <th className="border p-2">Código</th>
              <th className="border p-2 text-left">Descrição</th>
              <th className="border p-2">Qtde</th>
              <th className="border p-2">% Desc</th>
              <th className="border p-2">Pr. Total</th>
            </tr>
          </thead>
          <tbody>
            {venda.map((p, idx) => (
              <tr key={p.id} className="text-center border-b hover:bg-blue-50">
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
                    className="w-14 border rounded text-center focus:outline-blue-500"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={p.desconto}
                    onChange={(e) => alterarDesconto(p.id, Number(e.target.value))}
                    className="w-14 border rounded text-center focus:outline-blue-500"
                  />
                </td>
                <td className="border p-2 font-bold text-green-700">
                  R$ {(p.qtd * (p.preco_venda - p.preco_venda * (p.desconto / 100))).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {/* === MODAL DE PAGAMENTO === */}
      {showPagamento && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-[95%] sm:w-[420px] max-w-full p-5 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <h2 className="text-2xl font-bold text-blue-700 text-center mb-5">
              🧾 Finalizar Venda
            </h2>

            {/* Tipo, pagamento, e botões */}
            <div className="flex flex-col gap-3">
              <button
                onClick={imprimirCupom}
                className="bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition"
              >
                🖨️ Imprimir Cupom
              </button>

              <button
                onClick={() => setShowPagamento(false)}
                className="bg-gray-400 text-white py-2 rounded-md hover:bg-gray-500"
              >
                ↩️ Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}