"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    const res = await fetch("/api/pedidos/listar");
    const data = await res.json();
    setPedidos(data || []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">
        Meus Pedidos
      </h1>

      {loading && <p>Carregando pedidos...</p>}

      {!loading && pedidos.length === 0 && (
        <p className="text-gray-500">Nenhum pedido encontrado.</p>
      )}

      <div className="space-y-4">
        {pedidos.map((p) => (
          <Link
            href={`/pedido/${p.id}`}
            key={p.id}
            className="block border border-blue-100 bg-white rounded-xl p-4 hover:bg-blue-50 transition"
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-blue-600">
                  Pedido #{p.id}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(p.created_at).toLocaleString("pt-BR")}
                </p>
              </div>

              <span
                className={`text-sm font-semibold ${
                  p.status === "pago"
                    ? "text-green-600"
                    : p.status === "cancelado"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {p.status.toUpperCase()}
              </span>
            </div>

            <p className="text-sm text-gray-700 mt-1">
              Total: R$ {(p.total || 0).toFixed(2)}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
