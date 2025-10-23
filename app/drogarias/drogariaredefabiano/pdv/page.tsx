"use client";

import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PDVPage() {
  const [showPagamento, setShowPagamento] = useState(false);
  const [tipoVenda, setTipoVenda] = useState("balcao");
  const [pagamento, setPagamento] = useState("pix");
  const [cliente, setCliente] = useState({
    nome: "",
    telefone: "",
    endereco: "",
  });
  const [total, setTotal] = useState(9.99); // valor de teste

  const inputRef = useRef<HTMLInputElement>(null);

  // 🧾 Função para imprimir o cupom
  const imprimirCupom = () => {
    const conteudo = `
      <html>
      <head>
        <title>Cupom - Drogaria Rede Fabiano</title>
        <style>
          body { font-family: Arial; text-align: center; }
          h2 { color: #004AAD; }
          hr { border: 1px dashed #aaa; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h2>🧾 Drogaria Rede Fabiano</h2>
        <hr />
        <p><b>Tipo de Venda:</b> ${tipoVenda.toUpperCase()}</p>
        <p><b>Forma de Pagamento:</b> ${pagamento.toUpperCase()}</p>
        ${
          cliente.nome
            ? <p><b>Cliente:</b> ${cliente.nome}</p>
            : ""
        }
        ${
          cliente.endereco
            ? <p><b>Endereço:</b> ${cliente.endereco}</p>
            : ""
        }
        <hr />
        <h3>Total: R$ ${total.toFixed(2)}</h3>
        <p><small>CNPJ: 62.157.257/0001-09</small></p>
        <p>💙 Obrigado pela preferência!</p>
        <script>window.print();</script>
      </body>
      </html>
    `;
    const novaJanela = window.open("", "_blank");
    if (novaJanela) {
      novaJanela.document.write(conteudo);
      novaJanela.document.close();
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">
        PDV — Drogaria Rede Fabiano
      </h1>

      {/* Botão para abrir o modal */}
      <button
        onClick={() => setShowPagamento(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md"
      >
        Finalizar Venda
      </button>

      {/* 🌟 Modal moderno */}
      {showPagamento && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-fadeIn">
            <h2 className="text-2xl font-bold text-blue-700 flex items-center mb-4">
              🧾 Finalizar Venda
            </h2>

            {/* Tipo de Venda */}
            <label className="block text-gray-700 font-medium mb-1">
              Tipo de Venda:
            </label>
            <div className="flex gap-2 mb-4">
              {["balcao", "entrega", "externo"].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setTipoVenda(tipo)}
                  className={`flex-1 py-2 rounded-md font-semibold ${
                    tipoVenda === tipo
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {tipo === "balcao"
                    ? "Balcão"
                    : tipo === "entrega"
                    ? "Entrega"
                    : "Externo"}
                </button>
              ))}
            </div>

            {/* Dados do Cliente */}
            <input
              type="text"
              placeholder="Nome do Cliente"
              value={cliente.nome}
              onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-2 mb-3"
            />
            <input
              type="text"
              placeholder="Telefone"
              value={cliente.telefone}
              onChange={(e) =>
                setCliente({ ...cliente, telefone: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md p-2 mb-3"
            />
            <input
              type="text"
              placeholder="Endereço de Entrega"
              value={cliente.endereco}
              onChange={(e) =>
                setCliente({ ...cliente, endereco: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
            />

            {/* Forma de Pagamento */}
            <label className="block text-gray-700 font-medium mb-1">
              Forma de Pagamento:
            </label>
            <div className="flex gap-2 mb-4">
              {["pix", "dinheiro", "cartao", "misto"].map((f) => (
                <button
                  key={f}
                  onClick={() => setPagamento(f)}
                  className={`flex-1 py-2 rounded-md font-semibold ${
                    pagamento === f
                      ? f === "pix"
                        ? "bg-green-600 text-white"
                        : "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {f === "pix"
                    ? "Pix"
                    : f === "dinheiro"
                    ? "Dinheiro"
                    : f === "cartao"
                    ? "Cartão"
                    : "Misto"}
                </button>
              ))}
            </div>

            {/* Informações extras */}
            {pagamento === "pix" && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-4 text-center text-sm text-blue-700">
                💡 Pagamento via Pix<br />
                <b>CNPJ:</b> 62.157.257/0001-09
              </div>
            )}

            {/* Total */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Total da Venda:
              </h3>
              <p className="text-2xl font-bold text-blue-700">
                R$ {total.toFixed(2)}
              </p>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col gap-2">
              <button
                onClick={imprimirCupom}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold"
              >
                🧾 Imprimir Cupom
              </button>

              <button
                onClick={() =>
                  window.open("https://wa.me/5511948343725", "_blank")
                }
                className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-semibold"
              >
                💬 Enviar WhatsApp da Loja
              </button>

              <button
                onClick={() => {
                  alert("Venda confirmada com sucesso!");
                  setShowPagamento(false);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-semibold"
              >
                ✅ Confirmar Venda
              </button>

              <button
                onClick={() => setShowPagamento(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-md font-semibold"
              >
                ↩ Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}