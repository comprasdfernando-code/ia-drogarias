"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ComandasPendentes({ empresaId, caixaId, onAbrir }: any) {
  const [lista, setLista] = useState<any[]>([]);
  const [erro, setErro] = useState("");

  async function carregar() {
    setErro("");
    const { data, error } = await supabase
      .from("ae_comandas")
      .select("id,numero,status,total,created_at")
      .eq("empresa_id", empresaId)
      .in("status", ["rascunho", "aberta"])
      .order("created_at", { ascending: true });

    if (error) {
      setErro(error.message);
      return;
    }
    setLista(data || []);
  }

  async function abrir(c: any) {
    // só muda status se estiver rascunho
    if (c.status === "rascunho") {
      const { error } = await supabase
        .from("ae_comandas")
        .update({ status: "aberta", caixa_id: caixaId })
        .eq("id", c.id);

      if (error) {
        alert(error.message);
        return;
      }
    }

    // recarrega o registro atualizado
    const { data } = await supabase.from("ae_comandas").select("*").eq("id", c.id).single();
    if (data) onAbrir(data);

    carregar();
  }

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 3000); // atualiza a cada 3s
    return () => clearInterval(t);
  }, [empresaId]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Comandas Pendentes</h2>
        <button onClick={carregar} className="text-xs bg-slate-800 px-3 py-1 rounded">
          Atualizar
        </button>
      </div>

      {erro && <div className="text-xs text-red-300 mb-2">{erro}</div>}

      {lista.length === 0 ? (
        <div className="text-sm text-slate-400">Nenhuma comanda pendente.</div>
      ) : (
        <div className="divide-y divide-slate-800">
          {lista.map((c) => (
            <button
              key={c.id}
              className="w-full text-left py-2 flex items-center justify-between hover:bg-slate-800 px-2 rounded"
              onClick={() => abrir(c)}
            >
              <div className="text-sm">
                <b>#{c.numero}</b> <span className="text-xs text-slate-400">({c.status})</span>
              </div>
              <div className="text-sm font-semibold">R$ {Number(c.total || 0).toFixed(2)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
