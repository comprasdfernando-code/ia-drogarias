"use client";

import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import FinalizarModal from "./FinalizarModal";

export default function CartBar() {
  const { carrinho } = useCart();
  const [open, setOpen] = useState(false);

  const total = carrinho.reduce(
    (acc, item) => acc + parseFloat(item.preco),
    0
  );

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          background: "#fff",
          padding: "12px 20px",
          boxShadow: "0 -3px 8px rgba(0,0,0,0.15)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 50,
        }}
      >
        <div>
          <strong>Total:</strong> R$ {total.toFixed(2)}
        </div>

        <button
          onClick={() => setOpen(true)}
          style={{
            background: "#25d366",
            border: "none",
            padding: "8px 14px",
            borderRadius: 8,
            color: "white",
            cursor: "pointer",
          }}
        >
          Pedir no WhatsApp
        </button>
      </div>

      {open && <FinalizarModal close={() => setOpen(false)} />}
    </>
  );
}
