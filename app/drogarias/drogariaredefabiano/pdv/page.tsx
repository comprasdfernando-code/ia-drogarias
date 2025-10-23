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

  // --- INTERFACE ---
  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">
        💻 PDV — Drogaria Rede Fabiano
      </h1>

      <input
        ref={inputRef}
        type="text"
        placeholder="Digite o nome ou código de barras..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onKeyDown={buscarProduto}
        className="w-full border p-2 rounded-md mb-4 text-lg focus:outline-blue-600"
      />

      {/* Lista de produtos encontrados */}
      {resultados.length > 0 && (
        <div className="border rounded bg-white shadow p-2 mb-3">
          {resultados.map((p, idx) => (
            <div
              key={p.id}
              tabIndex={idx}
              onClick={() => adicionarProduto(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter") adicionarProduto(p);
              }}
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

      {/* Tabela da venda */}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const next = document.querySelector(
                          `#desconto-${idx}`
                        ) as HTMLElement;
                        next?.focus();
                      }
                    }}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const next = document.querySelector(
                          `#produto-${idx + 1}`
                        ) as HTMLElement;
                        next?.focus();
                      }
                    }}
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

      {/* === MODAL NOVO === */}
      {showPagamento && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-[420px] max-w-full p-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-blue-700 text-center mb-5">
              🧾 Finalizar Venda
            </h2>

            {/* Tipo da venda */}
            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">
                Tipo de Venda:
              </label>
              <div className="flex justify-between gap-2">
                {["Balcão", "Entrega", "Externo"].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setPagamento((prev: any) => ({ ...prev, tipo }))}
                    className={`flex-1 py-2 rounded-md border ${
                      pagamento.tipo === tipo
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Dados cliente se entrega */}
            {pagamento.tipo === "Entrega" && (
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Nome do Cliente"
                  value={pagamento.nome || ""}
                  onChange={(e) =>
                    setPagamento((prev: any) => ({ ...prev, nome: e.target.value }))
                  }
                  className="w-full border rounded p-2 focus:outline-blue-500"
                />
                <input
                  type="text"
                  placeholder="Telefone"
                  value={pagamento.telefone || ""}
                  onChange={(e) =>
                    setPagamento((prev: any) => ({
                      ...prev,
                      telefone: e.target.value,
                    }))
                  }
                  className="w-full border rounded p-2 focus:outline-blue-500"
                />
                <input
                  type="text"
                  placeholder="Endereço de Entrega"
                  value={pagamento.endereco || ""}
                  onChange={(e) =>
                    setPagamento((prev: any) => ({
                      ...prev,
                      endereco: e.target.value,
                    }))
                  }
                  className="w-full border rounded p-2 focus:outline-blue-500"
                />
              </div>
            )}

            {/* Formas de pagamento */}
            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">
                Forma de Pagamento:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Pix", "Cartão", "Dinheiro", "Misto"].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() =>
                      setPagamento((prev: any) => ({ ...prev, forma: tipo }))
                    }
                    className={`py-2 rounded-md border ${
                      pagamento.forma === tipo
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* PIX */}
            {pagamento.forma === "Pix" && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-center">
                <p className="text-blue-700 font-semibold mb-1">
                  💳 Pagamento via Pix
                </p>
                <p className="text-gray-700 text-sm">CNPJ: 62.157.257/0001-09</p>
              </div>
            )}

            {/* Dinheiro */}
            {pagamento.forma === "Dinheiro" && (
              <div className="mb-4">
                <label className="block text-sm mb-1 text-gray-600">
                  Valor Recebido (R$)
                </label>
                <input
                  type="number"
                  value={pagamento.dinheiro}
                  onChange={(e) => calcularTroco(e.target.value)}
                  className="w-full border rounded p-2 text-right focus:outline-blue-500"
                />
                <p className="text-sm mt-2 text-gray-700">
                  Troco:{" "}
                  <span className="font-bold text-green-600">
                    R$ {pagamento.troco}
                  </span>
                </p>
              </div>
            )}

            {/* Total */}
            <div className="border-t mt-4 pt-3 text-center">
              <p className="text-gray-600">Total da Venda</p>
              <p className="text-3xl font-bold text-blue-700">
                R$ {total.toFixed(2)}
              </p>
            </div>

            {/* Botões finais */}
            <div className="flex flex-col gap-2 mt-6">
              <button
                onClick={() => alert("🖨️ Imprimindo Cupom...")}
                className="bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition"
              >
                🖨️ Imprimir Cupom
              </button>

              {/* 📲 ENVIO AUTOMÁTICO PARA WHATSAPP */}
              <button
                onClick={() => {
                  const mensagem = encodeURIComponent(`
💊 Novo Pedido — Drogaria Rede Fabiano

🧾 Tipo: ${pagamento.tipo || "Balcão"}
👤 Cliente: ${pagamento.nome || "Não informado"}
📞 Telefone: ${pagamento.telefone || "Não informado"}
🏠 Endereço: ${pagamento.endereco || "Não informado"}

📦 Produtos:
${venda
  .map(
    (p) =>
      `• ${p.nome} — ${p.qtd}x R$ ${p.preco_venda?.toFixed(
        2
      )} (${p.desconto}% desc)`
  )
  .join("\n")}

💰 Total: R$ ${total.toFixed(2)}
💳 Pagamento: ${pagamento.forma || "Não informado"}
${pagamento.forma === "Pix" ? "🔢 CNPJ: 62.157.257/0001-09" : ""}
                  `);

                  const numero = "5511948343725"; // WhatsApp Drogaria Rede Fabiano
                  window.open(
                    `https://wa.me/${numero}?text=${mensagem}`,
                    "_blank"
                  );
                }}
                className="bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition"
              >
                📲 Enviar WhatsApp da Loja
              </button>

              <button
                onClick={finalizarVenda}
                className="bg-blue-800 text-white py-2 rounded-md font-semibold hover:bg-blue-900 transition"
              >
                ✅ Confirmar Venda
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