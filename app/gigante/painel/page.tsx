"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Venda = {
  id: string;
  data: string;
  total: number;
  status: string;
  tipo_entrega: string;
  metodo_pagamento: string;
  cliente_nome?: string | null;
  cliente_telefone?: string | null;
  cliente_endereco?: string | null;
};

export default function PainelPedidos() {
  const [pedidos, setPedidos] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("gigante_vendas")
      .select(
        "id,data,total,status,tipo_entrega,metodo_pagamento,cliente_nome,cliente_telefone,cliente_endereco"
      )
      .order("data", { ascending: false });

    if (!error) setPedidos((data as any) || []);
    setLoading(false);
  }

  async function mudarStatus(id: string, status: string) {
    await supabase.from("gigante_vendas").update({ status }).eq("id", id);
    carregar();
  }

  useEffect(() => {
    carregar();

    // Recarrega a cada 5s (MVP). Depois fazemos realtime.
    const t = setInterval(carregar, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">📥 Painel de Pedidos</h1>
        <button onClick={carregar} className="px-3 py-2 rounded border">
          Atualizar
        </button>
      </div>

      {loading && <p>Carregando...</p>}

      <div className="space-y-3">
        {pedidos.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">
                  Pedido {p.id.slice(0, 6).toUpperCase()} •{" "}
                  {new Date(p.data).toLocaleString("pt-BR")}
                </p>
                <p className="text-sm text-gray-600">
                  {p.tipo_entrega} • {p.metodo_pagamento} •{" "}
                  <b>R$ {Number(p.total).toFixed(2)}</b>
                </p>
                <p className="text-sm">
                  Status: <b>{p.status}</b>
                </p>

                {p.tipo_entrega === "entrega" && (
                  <p className="text-sm text-gray-700 mt-1">
                    📍 {p.cliente_nome} • {p.cliente_telefone}
                    <br />
                    {p.cliente_endereco}
                  </p>
                )}
              </div>

              <Link
                className="px-3 py-2 rounded bg-gray-900 text-white"
                href={`/gigante/cupom/${p.id}`}
                target="_blank"
              >
                Imprimir
              </Link>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => mudarStatus(p.id, "novo")}
                className="px-3 py-2 rounded border"
              >
                Novo
              </button>
              <button
                onClick={() => mudarStatus(p.id, "preparo")}
                className="px-3 py-2 rounded border"
              >
                Preparo
              </button>
              <button
                onClick={() => mudarStatus(p.id, "pronto")}
                className="px-3 py-2 rounded border"
              >
                Pronto
              </button>
              <button
                onClick={() => mudarStatus(p.id, "entregue")}
                className="px-3 py-2 rounded border"
              >
                Entregue
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
