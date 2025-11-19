"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Faturamento = {
  id: string;
  numero_nf: string | null;
  competencia: string | null;
  valor_liquido: number;
};

export default function NovoFomento() {
  const router = useRouter();
  const [fat, setFat] = useState<Faturamento[]>([]);
  const [faturamento_id, setFaturamentoId] = useState("");
  const [valor_clean, setValorClean] = useState("");
  const [loading, setLoading] = useState(false);

  async function carregarFat() {
    const { data } = await supabase
      .from("finance_faturamento")
      .select("id, numero_nf, competencia, valor_liquido")
      .order("competencia", { ascending: true });

    if (data) setFat(data);
  }

  async function salvar() {
    if (!faturamento_id || !valor_clean) {
      alert("Preencha todos os campos");
      return;
    }

    setLoading(true);

    await supabase.from("finance_fomento").insert({
      faturamento_id,
      valor_clean: Number(valor_clean),
      diferenca: null,
    });

    router.push("/financeiro/admin/fomento");
  }

  useEffect(() => {
    carregarFat();
  }, []);

  return (
    <div className="p-8 space-y-6">

      <h2 className="text-2xl text-cyan-300 font-semibold">
        Novo Lançamento de Fomento
      </h2>

      <div className="space-y-4 bg-[#0D1B2A] p-6 rounded-xl border border-cyan-500/20">

        {/* FATURAMENTO */}
        <div>
          <label className="text-slate-300 text-sm">Vincular ao Faturamento</label>
          <select
            className="w-full mt-1 p-2 rounded bg-[#112240] text-white border border-cyan-500/20"
            value={faturamento_id}
            onChange={(e) => setFaturamentoId(e.target.value)}
          >
            <option value="">Selecione</option>
            {fat.map((f) => (
              <option key={f.id} value={f.id}>
                {f.competencia} — NF {f.numero_nf} — {f.valor_liquido.toLocaleString("pt-BR")}
              </option>
            ))}
          </select>
        </div>

        {/* VALOR CLEAN */}
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
          {loading ? "Salvando..." : "Salvar"}
        </button>

      </div>

    </div>
  );
}
