"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Item = {
  id: string;
  comanda_id: string;
  nome: string;
  ean: string | null;
  tipo: string | null;
  preco: number;
  quantidade: number;
  subtotal: number;
};

function brl(v: any) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ItensComanda({ comandaId }: { comandaId: string }) {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string>("");
  const [itens, setItens] = useState<Item[]>([]);

  async function carregar() {
    if (!comandaId) return;
    setLoading(true);
    setErro("");

    const { data, error } = await supabase
      .from("ae_comanda_itens")
      .select("id,comanda_id,nome,ean,tipo,preco,quantidade,subtotal,created_at")
      .eq("comanda_id", comandaId)
      .order("created_at", { ascending: true });

    if (error) {
      setErro(error.message);
      setItens([]);
      setLoading(false);
      return;
    }

    setItens((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
    // atualiza a cada 2s enquanto estiver no caixa (simples e eficaz)
    const t = setInterval(carregar, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comandaId]);

  const totalItens = useMemo(
    () => itens.reduce((acc, it) => acc + (Number(it.quantidade) || 0), 0),
    [itens]
  );

  const totalCalc = useMemo(
    () => itens.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0),
    [itens]
  );

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="font-semibold">Itens da Comanda</div>
        <div className="text-xs text-slate-400">
          {totalItens} item(ns) · {brl(totalCalc)}
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-sm text-slate-300">Carregando itens…</div>
      ) : erro ? (
        <div className="p-4 text-sm text-red-300">{erro}</div>
      ) : itens.length === 0 ? (
        <div className="p-4 text-sm text-slate-400">Nenhum item nessa comanda.</div>
      ) : (
        <div className="divide-y divide-slate-800">
          {itens.map((it) => (
            <div key={it.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{it.nome}</div>
                <div className="text-xs text-slate-400">
                  {(it.tipo || "").toUpperCase()}
                  {it.ean ? ` · EAN ${it.ean}` : ""}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-300">
                  {it.quantidade}x <span className="text-slate-400">{brl(it.preco)}</span>
                </div>
                <div className="text-sm font-semibold text-slate-100">{brl(it.subtotal)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
