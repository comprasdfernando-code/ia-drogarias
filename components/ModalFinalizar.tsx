"use client";

import Image from "next/image";
import { useState } from "react";

type Produto = {
  id: string;
  nome: string;
  preco_venda: number;
  quantidade: number;
};

type Cliente = {
  nome: string;
  telefone: string;
  endereco: string;
  bairro?: string;
  complemento?: string;
};

type ModalFinalizarProps = {
  loja: string;
  whatsapp: string;
  pixChave: string;
  total: number;
  carrinho: Produto[];
  onConfirm: (cliente: Cliente, pagamento: any) => void;
  onClose: () => void;
};

export default function ModalFinalizar({
  loja,
  whatsapp,
  pixChave,
  total,
  carrinho,
  onConfirm,
  onClose,
}: ModalFinalizarProps) {
  const [cliente, setCliente] = useState<Cliente>({
    nome: "",
    telefone: "",
    endereco: "",
    bairro: "",
    complemento: "",
  });

  const [pagamento, setPagamento] = useState<"Pix" | "Cartão" | "Dinheiro">("Pix");
  const [tipoCartao, setTipoCartao] = useState<"Débito" | "Crédito">("Débito");
  const [trocoNecessario, setTrocoNecessario] = useState(false);
  const [trocoPara, setTrocoPara] = useState("");

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const validar = () => {
  const nomeValido = cliente.nome.trim().length >= 3;
  const telefoneLimpo = cliente.telefone.replace(/\D/g, ""); // remove traços, espaços, etc.
  const telefoneValido = telefoneLimpo.length >= 9;
  const enderecoValido = cliente.endereco.trim().length >= 5;

  return nomeValido && telefoneValido && enderecoValido;
};
  function enviarPedido() {
  if (!cliente.nome || !cliente.telefone || !cliente.endereco) {
    alert("Por favor, preencha todos os dados antes de confirmar o pedido.");
    return;
  }

  // Envia para a função principal com os dados corretos
  onConfirm(cliente, pagamento);
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="bg-blue-700 text-white flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Image src="/logo-ia.png" alt="IA Drogarias" width={35} height={35} />
            <h2 className="font-semibold text-lg">Finalizar Pedido</h2>
          </div>
          <button onClick={onClose} className="text-xl font-bold">
            ✖
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <p className="text-gray-700 text-sm">
            Loja: <b>{loja}</b>
          </p>

          {/* Itens */}
          <div className="bg-gray-50 rounded-md border p-3">
            {carrinho.map((i) => (
              <div key={i.id} className="flex justify-between text-sm border-b last:border-none py-1">
                <span>{i.nome} × {i.quantidade}</span>
                <span>R$ {fmt(i.preco_venda * i.quantidade)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold mt-2">
              <span>Total:</span>
              <span>R$ {fmt(total)}</span>
            </div>
          </div>

          {/* Forma de pagamento */}
          <div>
            <label className="block font-semibold text-sm mb-1">Forma de pagamento</label>
            <select
              value={pagamento}
              onChange={(e) => setPagamento(e.target.value as any)}
              className="w-full border rounded px-3 py-2"
            >
              <option>Pix</option>
              <option>Cartão</option>
              <option>Dinheiro</option>
            </select>

            {pagamento === "Pix" && (
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2 text-sm">
                <div>
                  Chave Pix (CNPJ): <b>{pixChave}</b>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(pixChave)}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                >
                  Copiar chave
                </button>
              </div>
            )}

            {pagamento === "Cartão" && (
              <div className="flex gap-2 mt-2">
                <button
                  className={`px-3 py-1 rounded border ${
                    tipoCartao === "Débito" ? "bg-blue-600 text-white" : "bg-white"
                  }`}
                  onClick={() => setTipoCartao("Débito")}
                >
                  Débito
                </button>
                <button
                  className={`px-3 py-1 rounded border ${
                    tipoCartao === "Crédito" ? "bg-blue-600 text-white" : "bg-white"
                  }`}
                  onClick={() => setTipoCartao("Crédito")}
                >
                  Crédito
                </button>
              </div>
            )}

            {pagamento === "Dinheiro" && (
              <div className="space-y-2 mt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={trocoNecessario}
                    onChange={(e) => setTrocoNecessario(e.target.checked)}
                  />
                  Precisa de troco?
                </label>
                {trocoNecessario && (
                  <input
                    type="number"
                    placeholder="Troco para quanto?"
                    value={trocoPara}
                    onChange={(e) => setTrocoPara(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                )}
              </div>
            )}
          </div>

          {/* Dados do cliente */}
          <div>
            <label className="block font-semibold text-sm mb-1">Dados para entrega</label>
            <input
              type="text"
              placeholder="Nome completo*"
              value={cliente.nome}
              onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
              className="w-full border rounded px-3 py-2 mb-2"
            />
            <input
              type="tel"
              placeholder="Telefone/WhatsApp*"
              value={cliente.telefone}
              onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })}
              className="w-full border rounded px-3 py-2 mb-2"
            />
            <input
              type="text"
              placeholder="Endereço completo*"
              value={cliente.endereco}
              onChange={(e) => setCliente({ ...cliente, endereco: e.target.value })}
              className="w-full border rounded px-3 py-2 mb-2"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Bairro (opcional)"
                value={cliente.bairro || ""}
                onChange={(e) => setCliente({ ...cliente, bairro: e.target.value })}
                className="w-1/2 border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Complemento (opcional)"
                value={cliente.complemento || ""}
                onChange={(e) => setCliente({ ...cliente, complemento: e.target.value })}
                className="w-1/2 border rounded px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={enviarPedido}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
          >
            Confirmar Pedido via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}