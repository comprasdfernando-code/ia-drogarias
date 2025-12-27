"use client";

import { useEffect, useRef, useState } from "react";
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ultimosIdsRef = useRef<Set<string>>(new Set());

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("gigante_vendas")
      .select(
        "id,data,total,status,tipo_entrega,metodo_pagamento,cliente_nome,cliente_telefone,cliente_endereco"
      )
      .order("data", { ascending: false });

    if (!error && data) {
      setPedidos(data as any);
      // marca ids já existentes pra não bipar tudo ao abrir
      ultimosIdsRef.current = new Set((data as any).map((p: any) => p.id));
    }
    setLoading(false);
  }

  async function mudarStatus(id: string, status: string) {
    await supabase.from("gigante_vendas").update({ status }).eq("id", id);
  }

  useEffect(() => {
    carregar();

    // 🔔 realtime
    const channel = supabase
      .channel("gigante-painel-pedidos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gigante_vendas" },
        async (payload) => {
          // Atualiza lista rapidamente
          const { data } = await supabase
            .from("gigante_vendas")
            .select(
              "id,data,total,status,tipo_entrega,metodo_pagamento,cliente_nome,cliente_telefone,cliente_endereco"
            )
            .order("data", { ascending: false });

          if (data) setPedidos(data as any);

          // 🔔 Som somente quando chegar INSERT novo
          if (payload.eventType === "INSERT") {
            const novoId = (payload.new as any)?.id;
            if (novoId && !ultimosIdsRef.current.has(novoId)) {
              ultimosIdsRef.current.add(novoId);

              // Tenta tocar som (pode precisar 1 clique no painel pra liberar áudio)
              try {
                await audioRef.current?.play();
              } catch {}
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* áudio do “bip” */}
      <audio ref={audioRef} src="/sounds/new-order.mp3" preload="auto" />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">📥 Painel de Pedidos (Realtime)</h1>
        <button onClick={carregar} className="px-3 py-2 rounded border">
          Atualizar
        </button>
      </div>

      {loading && <p>Carregando...</p>}

      <div className="space-y-3">
        {pedidos.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow p-3">
            <div className="flex items-start justify-between gap-3">
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

            <div className="flex flex-wrap gap-2 mt-3">
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

            <p className="text-xs text-gray-500 mt-2">
              Dica: se o som não tocar, clique 1 vez em qualquer lugar do painel
              (o navegador libera áudio).
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
