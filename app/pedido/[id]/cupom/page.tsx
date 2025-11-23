"use client";

import { useEffect, useState } from "react";

export default function CupomPage({ params }) {
  const id = params.id;
  const [pedido, setPedido] = useState(null);

  async function carregar() {
    const r = await fetch(`/api/pedidos/detalhe?id=${id}`);
    const d = await r.json();
    setPedido(d);
  }

  useEffect(() => {
    carregar();
  }, []);

  function imprimir() {
    window.print();
  }

  if (!pedido) return <p className="p-10">Carregando...</p>;

  return (
    <main className="max-w-sm mx-auto p-4 print:w-[58mm]">
      <h1 className="text-center font-bold text-lg mb-6">
        IA DROGARIAS
      </h1>

      <p>Nº Pedido: {pedido.id}</p>
      <p>Data: {new Date(pedido.created_at).toLocaleString("pt-BR")}</p>
      <p>Status: {pedido.status}</p>

      <hr className="my-4" />

      <h2 className="font-semibold mb-2">Itens</h2>

      {pedido.itens?.map((i) => (
        <p key={i.id}>
          {i.nome} x{i.qtd}
        </p>
      ))}

      <hr className="my-4" />

      <p className="font-bold text-lg">
        Total: R$ {pedido.total.toFixed(2)}
      </p>

      <button
        onClick={imprimir}
        className="mt-6 w-full py-2 bg-blue-600 text-white rounded"
      >
        Imprimir
      </button>
    </main>
  );
}
