"use client";

import { SorveteProduto } from "../../../types/sorveteria";

type CartItem = SorveteProduto & { qty: number };

interface Props {
  cart: CartItem[];
  changeQty: (id: string, qty: number) => void;
  total: number;
  open: boolean;
  onClose: () => void;
  onSend: () => void;
}

export default function CartSidebar({ cart, changeQty, total, open, onClose, onSend }: Props) {
  return (
    <>
      {/* Fundo escuro */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      {/* Painel lateral */}
      <div
        className={`
          fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Seu Carrinho</h2>
          <button onClick={onClose} className="text-red-600 font-bold">X</button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-150px)]">
          {cart.length === 0 ? (
            <p className="text-center text-neutral-500 mt-10">Carrinho vazio 😕</p>
          ) : (
            cart.map((i) => (
              <div key={i.id} className="flex items-center justify-between mb-4 border-b pb-2">
                <div className="text-sm font-semibold">{i.nome}</div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    className="w-14 px-2 py-1 border rounded"
                    value={i.qty}
                    onChange={(e) =>
                      changeQty(i.id, parseInt(e.target.value || "1", 10))
                    }
                  />
                  <div className="text-sm font-bold">
                    R$ {(i.preco * i.qty).toFixed(2).replace(".", ",")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t">
          <div className="text-xl font-extrabold mb-3">
            Total: R$ {total.toFixed(2).replace(".", ",")}
          </div>
          <button
            onClick={onSend}
            disabled={cart.length === 0}
            className="w-full px-4 py-3 rounded-lg bg-green-600 text-white text-lg disabled:opacity-50"
          >
            Pedir no WhatsApp
          </button>
        </div>
      </div>
    </>
  );
}
