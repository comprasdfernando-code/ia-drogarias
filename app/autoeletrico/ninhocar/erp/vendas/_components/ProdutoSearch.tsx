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
  const [erro, setErro] = useState("");

  async function buscar() {
    const q = busca.trim();
    if (!q) return;

    setErro("");
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
    } catch (e: any) {
      setErro(e?.message || "Erro na busca");
      setResultados([]);
    } finally {
      setLoading(false);
    }
  }

  function add(prod: any) {
    // se controla estoque e está zerado, não adiciona
    const estoque = Number(prod.estoque_atual || 0);
    if (prod.controla_estoque && estoque <= 0) {
      setErro("Sem estoque para esse item.");
      return;
    }

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
    setErro("");
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 border border-slate-700 bg-slate-950/60 rounded px-3 py-2 outline-none text-slate-100 placeholder:text-slate-500"
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

      {erro && (
        <div className="text-sm text-red-300 bg-red-950/30 border border-red-900 rounded-lg p-2">
          {erro}
        </div>
      )}

      {resultados.length > 0 && (
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          {resultados.map((p) => {
            const estoque = Number(p.estoque_atual || 0);
            const semEstoque = p.controla_estoque && estoque <= 0;

            return (
              <button
                key={p.id}
                className={`w-full text-left px-3 py-2 flex items-center justify-between ${
                  semEstoque ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-800"
                }`}
                onClick={() => !semEstoque && add(p)}
                disabled={semEstoque}
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-100 truncate">{p.nome}</div>

                  <div className="text-xs text-slate-400 flex flex-wrap gap-2">
                    <span>{String(p.tipo || "").toUpperCase()}</span>
                    {p.sku ? <span>SKU {p.sku}</span> : null}
                    {p.ean ? <span>EAN {p.ean}</span> : null}

                    {/* ESTOQUE */}
                    {p.controla_estoque ? (
                      <span
                        className={`px-2 py-0.5 rounded border ${
                          semEstoque
                            ? "bg-red-950/30 text-red-200 border-red-900"
                            : "bg-emerald-950/30 text-emerald-200 border-emerald-900"
                        }`}
                      >
                        Estoque: {estoque}
                      </span>
                    ) : (
                      <span className="text-slate-500">Sem estoque</span>
                    )}
                  </div>

                  {semEstoque && (
                    <div className="text-xs text-red-300 mt-1">Sem estoque</div>
                  )}
                </div>

                <div className="font-semibold text-slate-100">
                  R$ {Number(p.preco || 0).toFixed(2)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
