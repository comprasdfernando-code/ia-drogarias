"use client";

import { X } from "lucide-react";

type Props = {
  open: boolean;
  cart: any[];
  changeQty: (id: string, qty: number) => void;
  total: number;
  onClose: () => void;
  onSend: () => void;
};

export default function CartSidebar({
  open,
  cart,
  changeQty,
  total,
  onClose,
  onSend,
}: Props) {
  return (
    <div
      className={`fixed inset-0 z-40 transition-all duration-300 ${
        open ? "visible" : "invisible"
      }`}
    >
      {/* Fundo escuro */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      {/* Painel lateral */}
      <div
        className={`
          absolute right-0 top-0 h-full w-80 bg-white shadow-2xl 
          flex flex-col transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Título */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-fuchsia-700">
            🛒 Seu Carrinho
          </h2>

          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-800"
          >
            <X size={22} />
          </button>
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-neutral-500 text-center mt-20">
              Carrinho vazio 😕
            </div>
          ) : (
            cart.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between border-b pb-3 mb-3"
              >
                <div>
                  <div className="font-semibold text-fuchsia-700">
                    {i.nome}
                  </div>
                  {i.sabor && (
                    <div className="text-sm text-neutral-500">{i.sabor}</div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={i.qty}
                    onChange={(e) =>
                      changeQty(i.id, parseInt(e.target.value || "1"))
                    }
                    className="w-12 border rounded px-2 py-1 text-sm"
                  />

                  <div className="font-bold text-fuchsia-700">
                    R$ {(i.preco * i.qty).toFixed(2).replace(".", ",")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t bg-white">
          <div className="flex justify-between mb-3">
            <span className="text-lg font-semibold text-neutral-600">
              Total:
            </span>

            <span className="text-lg font-extrabold text-fuchsia-700">
              R$ {total.toFixed(2).replace(".", ",")}
            </span>
          </div>

          <button
            onClick={onSend}
            disabled={cart.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3 rounded-lg font-semibold shadow-md disabled:opacity-50"
          >
            Finalizar Pedido no WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
