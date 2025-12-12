"use client";

import { useState } from "react";
import { useCart } from "../context/CartContext";

export default function CartButton() {
  const [open, setOpen] = useState(false);
  const { cart, updateQty, removeItem } = useCart();

  const total = cart.reduce(
    (sum, i) => sum + i.preco * i.qty,
    0
  );

  return (
    <>
      {/* Ícone flutuante */}
      <button
        className="fixed top-4 right-4 bg-yellow-400 text-black p-3 rounded-full shadow-xl font-bold"
        onClick={() => setOpen(true)}
      >
        🛒 {cart.length}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/70 flex justify-end z-50">
          <div className="w-80 bg-black h-full border-l-4 border-yellow-400 p-5">

            {/* Header */}
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Seu Carrinho</h2>
              <button onClick={() => setOpen(false)}>❌</button>
            </div>

            {/* Lista */}
            {cart.map(item => (
              <div key={item.id} className="py-3 border-b border-white/20">
                <p className="font-bold">{item.nome}</p>

                <p className="text-yellow-400 font-bold">
                  R$ {(item.preco * item.qty).toFixed(2)}
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <button onClick={() => updateQty(item.id, item.qty - 1)} disabled={item.qty === 1}>➖</button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.qty + 1)}>➕</button>
                </div>

                <button
                  className="text-red-400 mt-1 text-sm"
                  onClick={() => removeItem(item.id)}
                >
                  Remover
                </button>
              </div>
            ))}

            {/* Total */}
            <p className="text-xl mt-4 font-bold">
              Total: <span className="text-yellow-400">R$ {total.toFixed(2)}</span>
            </p>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/55${process.env.NEXT_PUBLIC_WHATSAPP}?text=${encodeURIComponent(
                JSON.stringify(cart, null, 2)
              )}`}
              className="block bg-yellow-400 text-black mt-4 py-3 rounded text-center font-bold"
              target="_blank"
            >
              FINALIZAR NO WHATSAPP
            </a>
          </div>
        </div>
      )}
    </>
  );
}
