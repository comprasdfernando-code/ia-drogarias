"use client";

import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PDVPage() {
  const [busca, setBusca] = useState("");
  const [venda, setVenda] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [showPagamento, setShowPagamento] = useState(false);
  const [pagamento, setPagamento] = useState({
    forma: "pix",
    dinheiro: "",
    troco: "",
  });
  const [cliente, setCliente] = useState({ nome: "", endereco: "" });
  const [qrcodePix, setQrcodePix] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🔍 Buscar produto
  async function buscarProduto(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || !busca.trim()) return;
    const { data } = await supabase
      .from("produtos")
      .select("*")
      .or(`nome.ilike.%${busca}%,codigo_barras.ilike.%${busca}%`)
      .limit(10);

    if (data && data.length > 0) adicionarProduto(data[0]);
    else alert("Produto não encontrado!");
    setBusca("");
  }

  // ➕ Adicionar produto à venda
  function adicionarProduto(produto: any) {
    const existente = venda.find((p) => p.id === produto.id);
    let novaVenda;
    if (existente)
      novaVenda = venda.map((p) =>
        p.id === produto.id ? { ...p, qtd: p.qtd + 1 } : p
      );
    else
      novaVenda = [
        ...venda,
        { ...produto, qtd: 1, desconto: 0, preco_desc: produto.preco_venda },
      ];
    setVenda(novaVenda);
    calcularTotal(novaVenda);
  }

  // 🧮 Calcular total
  function calcularTotal(lista: any[]) {
    const soma = lista.reduce(
      (acc, p) =>
        acc +
        p.qtd * (p.preco_venda - p.preco_venda * (p.desconto / 100)),
      0
    );
    setTotal(soma);
  }

  // 🧾 Funções de edição
  function alterarQtd(id: any, delta: number) {
    const novaVenda = venda.map((p) =>
      p.id === id ? { ...p, qtd: Math.max(1, p.qtd + delta) } : p
    );
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

  // 💰 Abrir modal pagamento
  async function abrirPagamento() {
    if (pagamento.forma === "pix") {
      const payload = `00020126360014BR.GOV.BCB.PIX011462157257000109520400005303986540${total
        .toFixed(2)
        .replace(".", "")}5802BR5920Drogaria Rede Fabiano6009SAO PAULO62070503***6304`;
      const qr = await QRCode.toDataURL(payload);
      setQrcodePix(qr);
    }
    setShowPagamento(true);
  }

  // 🧾 Imprimir cupom
  function imprimirCupom() {
    const win = window.open("", "PRINT", "width=400,height=600");
    if (win) {
      win.document.write(`
        <html>
          <head><title>Cupom - Drogaria Rede Fabiano</title></head>
          <body style="font-family: monospace; text-align: center; padding: 10px;">
            <h3>💊 Drogaria Rede Fabiano</h3>
            <p>Saúde com Inteligência</p>
            <hr/>
            ${venda
              .map(
                (p) =>
                  `${p.nome}<br/>${p.qtd}x R$ ${p.preco_venda.toFixed(
                    2
                  )} = <b>R$ ${(p.qtd * p.preco_venda).toFixed(2)}</b><br/><br/>`
              )
              .join("")}
            <hr/>
            <h3>Total: R$ ${total.toFixed(2)}</h3>
            <p>Pagamento: ${pagamento.forma.toUpperCase()}</p>
            ${
              pagamento.forma === "pix"
                ? 
                `<img src="${qrcodePix}" width="150" /><br/><small>CNPJ Pix: 62.157.257/0001-09</small>`
                : ""
            }
            <hr/>
            ${
              cliente.nome
                ? `<p><b>Cliente:</b> ${cliente.nome}<br/><b>Endereço:</b> ${cliente.endereco}</p><hr/>`
                : ""
            }
            <p>Obrigado pela preferência! 💙</p>
          </body>
        </html>
      `);
      win.document.close();
      win.print();
    }
  }

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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border text-sm">
          <thead className="bg-blue-50 border-b text-gray-700 text-sm">
            <tr>
              <th className="border p-2 w-32">Código</th>
              <th className="border p-2 text-left">Descrição</th>
              <th className="border p-2 w-16">Qtde</th>
              <th className="border p-2 w-20">% Desc</th>
              <th className="border p-2 w-20">Preço</th>
              <th className="border p-2 w-20">Total</th>
            </tr>
          </thead>
          <tbody>
            {venda.map((p) => (
              <tr key={p.id} className="text-center border-b hover:bg-blue-50">
                <td className="border p-2 truncate">{p.id.slice(0, 6)}...</td>
                <td className="border p-2 text-left">{p.nome}</td>
                <td className="border p-2">
                  <input
                    type="number"
                    value={p.qtd}
                    onChange={(e) =>
                      alterarQtd(p.id, Number(e.target.value) - p.qtd)
                    }
                    className="w-14 border rounded text-center"
                  />
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
                    className="w-14 border rounded text-center"
                  />
                </td>
                <td className="border p-2">
                  R$ {p.preco_venda?.toFixed(2) || "0.00"}
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

      {venda.length > 0 && (
        <div className="flex justify-between items-center mt-6 border-t pt-4">
          <div className="text-gray-600 text-sm">
            Itens: {venda.reduce((acc, p) => acc + p.qtd, 0)}
          </div>
          <div className="text-2xl font-bold text-blue-700">
            Total: R$ {total.toFixed(2)}
          </div>
        </div>
      )}

      {venda.length > 0 && (
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => {
              setVenda([]);
              setTotal(0);
            }}
            className="bg-red-600 text-white px-5 py-2 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={abrirPagamento}
            className="bg-green-600 text-white px-5 py-2 rounded-md"
          >
            Finalizar Venda
          </button>
        </div>
      )}

      {/* 🪟 MODAL DE PAGAMENTO */}
      {showPagamento && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl">
            <h2 className="text-lg font-bold text-center text-blue-700 mb-3">
              💵 Fechamento da Venda
            </h2>

            <label className="block mb-2 text-sm font-semibold">
              Forma de pagamento:
            </label>
            <select
              value={pagamento.forma}
              onChange={(e) =>
                setPagamento((prev) => ({ ...prev, forma: e.target.value }))
              }
              className="w-full border p-2 rounded mb-3"
            >
              <option value="pix">Pix</option>
              <option value="cartao">Cartão</option>
              <option value="dinheiro">Dinheiro</option>
            </select>

            {pagamento.forma === "dinheiro" && (
              <div className="mb-3">
                <label className="block text-sm mb-1">Valor recebido (R$)</label>
                <input
                  type="number"
                  value={pagamento.dinheiro}
                  onChange={(e) => {
                    const recebido = parseFloat(e.target.value || "0");
                    const troco = recebido - total;
                    setPagamento({
                      ...pagamento,
                      dinheiro: e.target.value,
                      troco: troco > 0 ? troco.toFixed(2) : "0.00",
                    });
                  }}
                  className="w-full border rounded p-2 text-right focus:outline-blue-500"
                />
                <p className="text-right text-sm mt-1">
                  Troco: <b>R$ {pagamento.troco}</b>
                </p>
              </div>
            )}

            {pagamento.forma === "pix" && qrcodePix && (
              <div className="text-center my-3">
                <img src={qrcodePix} alt="QR Code Pix" className="mx-auto w-40" />
                <p className="text-xs mt-2 text-gray-600">
                  CNPJ Pix: 62.157.257/0001-09
                </p>
              </div>
            )}

            <div className="mt-4 border-t pt-3">
              <label className="block text-sm mb-1">Nome do cliente (opcional)</label>
              <input
                type="text"
                value={cliente.nome}
                onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                className="w-full border p-2 rounded mb-2"
              />
              <label className="block text-sm mb-1">
                Endereço / Entrega (opcional)
              </label>
              <input
                type="text"
                value={cliente.endereco}
                onChange={(e) =>
                  setCliente({ ...cliente, endereco: e.target.value })
                }
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="flex justify-between mt-5">
              <button
                onClick={() => setShowPagamento(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Voltar
              </button>
              <button
                onClick={imprimirCupom}
                className="bg-blue-700 text-white px-4 py-2 rounded"
              >
                🖨️ Imprimir Cupom
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}