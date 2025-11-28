"use client";

import { useState } from "react";

export default function CheckoutModal({ open, onClose, onConfirm }) {
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [ref, setRef] = useState("");
  const [pagamento, setPagamento] = useState("PIX");
  const [troco, setTroco] = useState("");

  if (!open) return null;

  function confirmar() {
    const dados = {
      nome,
      endereco,
      bairro,
      ref,
      pagamento,
      troco: pagamento === "Dinheiro" ? troco : null,
    };
    onConfirm(dados);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-end z-[999]">
      <div className="w-full max-w-md h-full bg-white rounded-l-2xl p-6 overflow-y-auto animate-slideLeft">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-fuchsia-700">Finalizar Pedido</h2>
          <button
            className="text-neutral-500 text-xl font-bold"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4">

          <input
            type="text"
            placeholder="Seu nome"
            className="border rounded-lg px-3 py-2"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <input
            type="text"
            placeholder="Endereço completo"
            className="border rounded-lg px-3 py-2"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
          />

          <input
            type="text"
            placeholder="Bairro"
            className="border rounded-lg px-3 py-2"
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
          />

          <input
            type="text"
            placeholder="Ponto de referência (opcional)"
            className="border rounded-lg px-3 py-2"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
          />

          <div>
            <label className="font-medium">Forma de pagamento:</label>
            <select
              className="border rounded-lg px-3 py-2 w-full mt-1"
              value={pagamento}
              onChange={(e) => setPagamento(e.target.value)}
            >
              <option>PIX</option>
              <option>Cartão</option>
              <option>Dinheiro</option>
            </select>
          </div>

          {pagamento === "Dinheiro" && (
            <input
              type="text"
              placeholder="Troco para quanto?"
              className="border rounded-lg px-3 py-2"
              value={troco}
              onChange={(e) => setTroco(e.target.value)}
            />
          )}

          <button
            onClick={confirmar}
            className="w-full bg-green-600 text-white rounded-lg py-3 font-semibold text-lg hover:bg-green-700"
          >
            Enviar pedido no WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
