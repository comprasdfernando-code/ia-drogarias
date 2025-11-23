"use client";

import { useEffect, useState } from "react";

const etapas = [
  { id: 1, nome: "Pedido Recebido" },
  { id: 2, nome: "Em Separação" },
  { id: 3, nome: "Saiu para Entrega" },
  { id: 4, nome: "Entregue" },
];

export default function AcompanharPedido({ params }) {
  const id = params.id;
  const [pedido, setPedido] = useState(null);

  async function carregar() {
    const r = await fetch(`/api/pedidos/detalhe?id=${id}`);
    const d = await r.json();
    setPedido(d);
  }

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!pedido) return <p className="p-10">Carregando...</p>;

  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-blue-600 mb-6">
        Acompanhar Pedido #{pedido.id}
      </h1>

      <div className="space-y-6">
        {etapas.map((etapa) => (
          <div key={etapa.id} className="flex items-center gap-3">
            <div
              className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center
                ${
                  etapa.id <= pedido.etapa
                    ? "bg-green-500 border-green-600"
                    : "border-gray-400"
                }
              `}
            >
            </div>

            <span
              className={`font-medium ${
                etapa.id <= pedido.etapa ? "text-green-600" : "text-gray-500"
              }`}
            >
              {etapa.nome}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        Atualizado automaticamente
      </p>
    </main>
  );
}
