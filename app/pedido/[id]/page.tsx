"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PedidoDetalhe({ params }) {
  const id = params.id;

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    const r = await fetch(`/api/pedidos/detalhe?id=${id}`);
    const d = await r.json();
    setPedido(d);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-gray-600">Carregando pedido...</p>
      </main>
    );
  }

  if (!pedido) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-red-600">Pedido não encontrado.</p>
        <Link
          href="/meus-pedidos"
          className="mt-4 inline-block text-blue-600 underline"
        >
          Voltar para Meus Pedidos
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      {/* Título */}
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        Pedido #{pedido.id}
      </h1>

      {/* STATUS */}
      <div className="mb-6">
        <span
          className={`px-3 py-1 rounded-lg text-white text-sm font-semibold ${
            pedido.status === "pago"
              ? "bg-green-600"
              : pedido.status === "cancelado"
              ? "bg-red-600"
              : "bg-yellow-500"
          }`}
        >
          {pedido.status.toUpperCase()}
        </span>
      </div>

      {/* VALORES */}
      <div className="bg-white border border-blue-100 rounded-xl p-4 mb-6 shadow-sm">
        <p className="text-lg font-semibold text-gray-800">
          Total: R$ {pedido.total?.toFixed(2)}
        </p>
        <p className="text-sm text-gray-500">
          Data: {new Date(pedido.created_at).toLocaleString("pt-BR")}
        </p>
      </div>

      {/* ITENS */}
      <h2 className="font-semibold text-lg text-blue-600 mb-2">
        Itens do pedido
      </h2>

      <div className="space-y-3 mb-6">
        {pedido.itens?.length > 0 ? (
          pedido.itens.map((item) => (
            <div
              key={item.id}
              className="flex justify-between bg-white border border-gray-200 rounded-lg p-3"
            >
              <span>{item.nome}</span>
              <span className="font-semibold">x{item.qtd}</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">Sem itens cadastrados.</p>
        )}
      </div>

      {/* ENTREGA */}
      <h2 className="font-semibold text-lg text-blue-600 mb-2">
        Endereço de entrega
      </h2>

      <p className="text-sm text-gray-700 mb-6">
        {pedido.endereco || "Endereço não informado"}
      </p>

      {/* WHATSAPP */}
      <a
        href={`https://wa.me/5511952068432?text=Olá! Quero saber sobre meu pedido ${pedido.id}.`}
        target="_blank"
        className="block w-full py-3 text-center bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
      >
        Falar com IA Drogarias
      </a>

      {/* Voltar */}
      <Link
        href="/meus-pedidos"
        className="block text-center w-full mt-4 py-3 border rounded-xl text-gray-700 hover:bg-gray-100 transition"
      >
        Voltar
      </Link>
    </main>
  );
}
