"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";

export default function EditarFomento() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [valor_clean, setValorClean] = useState("");
  const [loading, setLoading] = useState(false);

  async function carregar() {
    const { data } = await supabase
      .from("finance_fomento")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setValorClean(String(data.valor_clean));
    }
  }

  async function salvar() {
    setLoading(true);

    await supabase
      .from("finance_fomento")
      .update({ valor_clean: Number(valor_clean) })
      .eq("id", id);

    router.push("/financeiro/admin/fomento");
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="p-8 space-y-6">

      <h2 className="text-2xl text-cyan-300 font-semibold">Editar Fomento</h2>

      <div className="space-y-4 bg-[#0D1B2A] p-6 rounded-xl border border-cyan-500/20">

        <div>
          <label className="text-slate-300 text-sm">Valor Clean</label>
          <input
            type="number"
            className="w-full mt-1 p-2 rounded bg-[#112240] text-white border border-cyan-500/20"
            value={valor_clean}
            onChange={(e) => setValorClean(e.target.value)}
          />
        </div>

        <button
          onClick={salvar}
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded text-white"
        >
          {loading ? "Salvando..." : "Salvar Alterações"}
        </button>

      </div>

    </div>
  );
}
