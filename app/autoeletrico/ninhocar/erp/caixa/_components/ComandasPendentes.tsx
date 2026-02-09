"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function brl(v: any) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ComandasPendentes({
  empresaId,
  caixaId,
  onAbrir,
}: {
  empresaId: string;
  caixaId: string;
  onAbrir: (c: any) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [lista, setLista] = useState<any[]>([]);

  async function carregar() {
    setErro("");
    setLoading(true);

    const { data, error } = await supabase
      .from("ae_vw_comandas_para_caixa")
      .select("id,numero,status,total,created_at,cliente_nome,cliente_whatsapp")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: true });

    if (error) {
      setErro(error.message);
      setLista([]);
      setLoading(false);
      return;
    }

    setLista(data || []);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  async function abrir(c: any) {
    // vincula ao caixa e marca como aberta
    const { data, error } = await supabase
      .from("ae_comandas")
      .update({ caixa_id: caixaId, status: "aberta" })
      .eq("id", c.id)
      .select("id,numero,status,total,cliente_nome,cliente_whatsapp,observacao,empresa_id,caixa_id")
      .single();

    if (error) {
      setErro(error.message);
      return;
    }

    onAbrir(data);
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="font-semibold">Comandas Pendentes</div>
        <button
          onClick={carregar}
          className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded"
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="p-4 text-sm text-slate-300">Carregando…</div>
      ) : erro ? (
        <div className="p-4 text-sm text-red-300">{erro}</div>
      ) : lista.length === 0 ? (
        <div className="p-4 text-sm text-slate-400">Nenhuma comanda pendente.</div>
      ) : (
        <div className="divide-y divide-slate-800">
          {lista.map((c) => (
            <button
              key={c.id}
              onClick={() => abrir(c)}
              className="w-full text-left px-4 py-3 hover:bg-slate-800/40 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-semibold text-slate-100">
                  #{c.numero} <span className="text-xs text-slate-400">({c.status})</span>
                </div>

                <div className="text-xs text-slate-400 truncate">
                  {c.cliente_nome ? `Cliente: ${c.cliente_nome}` : "Cliente: —"}
                  {c.cliente_whatsapp ? ` · ${c.cliente_whatsapp}` : ""}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold text-slate-100">{brl(c.total)}</div>
                <div className="text-xs text-slate-500">abrir</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
