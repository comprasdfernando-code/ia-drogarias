"use client";

import { useState } from "react";

export default function ConfirmarEntrega({ params }) {
  const id = params.id;
  const [ok, setOk] = useState(false);

  async function confirmar() {
    await fetch("/api/pedidos/confirmar-entrega", {
      method: "POST",
      body: JSON.stringify({ id }),
    });

    setOk(true);
  }

  if (ok) {
    return (
      <main className="max-w-md mx-auto px-6 py-10 text-center">
        <h1 className="text-2xl font-bold text-green-600">
          Entrega Confirmada! ✔
        </h1>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-6 py-10 text-center">
      <h1 className="text-xl font-bold mb-8 text-blue-600">
        Confirmar Entrega do Pedido #{id}
      </h1>

      <button
        onClick={confirmar}
        className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold"
      >
        Confirmar Entrega
      </button>
    </main>
  );
}
