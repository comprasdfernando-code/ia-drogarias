"use client";

import { useState } from "react";
import Image from "next/image";
import type { SorveteProduto } from "../../../types/sorveteria";

type CartItem = SorveteProduto & { qty: number };

type Props = {
  open: boolean;
  cart: CartItem[];
  changeQty: (id: string, qty: number) => void;
  total: number;
  onClose: () => void;
  onSend: (data: any) => void;
};

export default function CartSidebar({
  open,
  cart,
  changeQty,
  total,
  onClose,
  onSend,
}: Props) {
  const [step, setStep] = useState<"cart" | "checkout">("cart");

  // Formulário do checkout
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [referencia, setReferencia] = useState("");
  const [pagamento, setPagamento] = useState("");
  const [obs, setObs] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Fundo escurecido */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[380px] bg-white shadow-2xl flex flex-col animate-slideLeft">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-fuchsia-700">
            {step === "cart" ? "Seu Pedido" : "Finalizar Pedido"}
          </h2>

          <button onClick={onClose} className="text-neutral-500 text-xl">×</button>
        </div>

        {/* ==========================
              TELA DO CARRINHO
        =========================== */}
        {step === "cart" && (
          <div className="flex flex-col flex-1 overflow-y-auto p-4 gap-4">

            {cart.length === 0 ? (
              <p className="text-neutral-500 text-center mt-10">
                Seu carrinho está vazio 🛒
              </p>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-2 border rounded-lg shadow-sm"
                >
                  {/* Imagem */}
                  {item.imagem_url && (
                    <Image
                      src={item.imagem_url}
                      alt={item.nome}
                      width={65}
                      height={65}
                      className="rounded-lg object-contain"
                      unoptimized
                    />
                  )}

                  {/* Texto */}
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{item.nome}</div>
                    {item.sabor && (
                      <div className="text-xs text-neutral-500">{item.sabor}</div>
                    )}

                    {/* QUANTIDADE */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        className="px-2 py-1 rounded bg-neutral-200"
                        onClick={() => changeQty(item.id, item.qty - 1)}
                      >
                        -
                      </button>
                      <span className="font-semibold text-fuchsia-700 w-6 text-center">
                        {item.qty}
                      </span>
                      <button
                        className="px-2 py-1 rounded bg-neutral-200"
                        onClick={() => changeQty(item.id, item.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Preço */}
                  <div className="font-bold text-fuchsia-700 text-sm">
                    R$ {(item.preco * item.qty).toFixed(2).replace(".", ",")}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ==========================
              TELA DE CHECKOUT
        =========================== */}
        {step === "checkout" && (
          <div className="flex flex-col flex-1 overflow-y-auto p-4 gap-4">

            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Endereço (Rua e número)"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Referência"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
            />

            <select
              className="border rounded-lg px-3 py-2"
              value={pagamento}
              onChange={(e) => setPagamento(e.target.value)}
            >
              <option value="">Forma de pagamento</option>
              <option value="Pix">Pix</option>
              <option value="Cartão">Cartão</option>
              <option value="Dinheiro">Dinheiro</option>
            </select>

            <textarea
              className="border rounded-lg px-3 py-2"
              placeholder="Observações (opcional)"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            />

            <button
              onClick={() => setStep("cart")}
              className="w-full py-2 border rounded-lg text-neutral-700"
            >
              Voltar ao Carrinho
            </button>
          </div>
        )}

        {/* Rodapé */}
        <div className="border-t p-4">
          {step === "cart" ? (
            <>
              <div className="flex justify-between font-bold text-lg mb-3">
                <span>Total:</span>
                <span className="text-fuchsia-700">
                  R$ {total.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={() => setStep("checkout")}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold
                disabled:opacity-40"
              >
                Finalizar Pedido
              </button>
            </>
          ) : (
            <button
              onClick={() =>
                onSend({ nome, endereco, bairro, referencia, pagamento, obs })
              }
              className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold"
            >
              Enviar via WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
