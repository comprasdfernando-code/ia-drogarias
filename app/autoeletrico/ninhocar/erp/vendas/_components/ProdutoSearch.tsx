"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { CartItem } from "./ItensTable";

export default function ProdutoSearch({
  empresaId,
  onAdd,
}: {
  empresaId: string;
  onAdd: (item: CartItem) => void;
}) {
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);

  async function buscar() {
    const q = busca.trim();
    if (!q) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ae_produtos")
        .select("id,nome,tipo,ean,sku,preco,controla_estoque,estoque_atual,ativo")
        .eq("empresa_id", empresaId)
        .eq("ativo", true)
        .or(`nome.ilike.%${q}%,ean.eq.${q},sku.eq.${q}`)
        .limit(12);

      if (error) throw error;
      setResultados(data || []);
    } finally {
      setLoading(false);
    }
  }

  function add(prod: any) {
    onAdd({
      produto_id: prod.id,
      tipo: prod.tipo,
      nome: prod.nome,
      ean: prod.ean,
      preco: Number(prod.preco) || 0,
      quantidade: 1,
    });
    setBusca("");
    setResultados([]);
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 border border-slate-700 bg-slate-950/60 rounded px-3 py-2 outline-none"
          placeholder="Buscar por nome, EAN ou SKU (scanner)"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") buscar();
          }}
        />
        <button
          className="bg-slate-800 hover:bg-slate-700 rounded px-4 py-2"
          onClick={buscar}
          disabled={loading}
        >
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {resultados.length > 0 && (
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          {resultados.map((p) => (
            <button
              key={p.id}
              className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between"
              onClick={() => add(p)}
            >
              <div>
                <div className="font-medium">{p.nome}</div>
                <div className="text-xs text-slate-400">
                  {p.tipo.toUpperCase()}
                  {p.sku ? ` · SKU ${p.sku}` : ""}
                  {p.ean ? ` · EAN ${p.ean}` : ""}
                </div>
              </div>
              <div className="font-semibold">
                R$ {Number(p.preco || 0).toFixed(2)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
