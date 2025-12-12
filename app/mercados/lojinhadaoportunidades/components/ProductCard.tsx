"use client";

import { useCart } from "../context/CartContext";

export default function ProductCard({ item }) {
  const { addToCart } = useCart();

  return (
    <div className="bg-black border border-yellow-400 rounded-xl p-3">
      <img src={item.foto} className="rounded-lg w-full h-40 object-cover mb-2" />

      <p className="font-bold">{item.nome}</p>

      <p className="text-yellow-400 text-2xl font-bold">
        R$ {item.preco.toFixed(2)}
      </p>

      <button
        onClick={() => addToCart(item)}
        className="w-full bg-yellow-400 text-black py-2 mt-2 rounded font-bold"
      >
        ADICIONAR
      </button>
    </div>
  );
}
