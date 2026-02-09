"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ComandasPendentes({
  empresaId,
  caixaId,
  onAbrir,
}: any) {
  const [lista, setLista] = useState<any[]>([]);

  async function carregar() {
    const { data } = await supabase
      .from("ae_vw_comandas_para_caixa")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at");

    setLista(data || []);
  }

  async function abrir(c: any) {
    const { data } = await supabase
      .from("ae_comandas")
      .update({ status: "aberta", caixa_id: caixaId })
      .eq("id", c.id)
      .select()
      .single();

    if (data) onAbrir(data);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="font-semibold mb-2">Comandas Pendentes</h2>

      {lista.map((c) => (
        <div
          key={c.id}
          className="flex justify-between p-2 border-b cursor-pointer hover:bg-slate-100"
          onClick={() => abrir(c)}
        >
          <span>#{c.numero}</span>
          <span>R$ {c.total.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
