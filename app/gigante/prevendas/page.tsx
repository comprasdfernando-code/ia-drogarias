"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Venda = {
  id: string;
  data: string;
  total: number;
  status: string;
  origem: string;
  metodo_pagamento?: string | null;
};

function money(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PreVendasPage() {
  const [lista, setLista] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("gigante_vendas")
      .select("id,data,total,status,origem,metodo_pagamento")
      .eq("origem", "PDV-PREV")
      .neq("status", "entregue")
      .order("data", { ascending: false });

    if (error) console.error(error);
    setLista((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    const b = busca.trim().toLowerCase();
    if (!b) return lista;
    return lista.filter((v) => v.id.toLowerCase().includes(b));
  }, [lista, busca]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold">🕓 Pré-vendas (Comandas)</h1>
          <p className="text-sm text-gray-600">
            Abra uma pré-venda no PDV para editar e finalizar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por ID (ex: A1B2C3)…"
            className="px-3 py-2 rounded border bg-white"
          />
          <button onClick={carregar} className="px-3 py-2 rounded border bg-white">
            Atualizar
          </button>
        </div>
      </div>

      {loading && <p>Carregando...</p>}

      <div className="space-y-3">
        {filtrados.map((v) => (
          <div key={v.id} className="bg-white rounded-xl shadow p-3 border-l-8 border-yellow-400">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold">
                  Pré-venda {v.id.slice(0, 6).toUpperCase()}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(v.data).toLocaleString("pt-BR")} • Status: <b>{v.status}</b>
                </div>
                <div className="text-sm mt-1">
                  Total: <b>R$ {money(Number(v.total || 0))}</b>{" "}
                  <span className="text-gray-500">• {v.metodo_pagamento || "A DEFINIR"}</span>
                </div>
              </div>

              <Link
                href={`/gigante/pdv?venda=${v.id}`}
                className="px-3 py-2 rounded bg-black text-white"
              >
                Abrir no PDV →
              </Link>
            </div>
          </div>
        ))}

        {!loading && filtrados.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            Nenhuma pré-venda em aberto.
          </div>
        )}
      </div>
    </div>
  );
}
