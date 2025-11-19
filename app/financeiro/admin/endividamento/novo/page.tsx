"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function NovoEndividamento() {
  const router = useRouter();

  const [instituicoes, setInstituicoes] = useState<any[]>([]);
  const [form, setForm] = useState({
    instituicao_id: "",
    modalidade: "",
    valor_total: "",
    saldo_devedor: "",
    parcela_atual: "",
    parcelas_total: "",
    juros_mensal: "",
    vencimento: "",
  });

  async function carregarInstituicoes() {
    const { data } = await supabase
      .from("finance_instituicoes")
      .select("id, nome")
      .order("nome");

    setInstituicoes(data ?? []);
  }

  async function salvar() {
    const { error } = await supabase.from("finance_endividamento").insert({
      ...form,
      valor_total: Number(form.valor_total),
      saldo_devedor: Number(form.saldo_devedor),
      parcela_atual: Number(form.parcela_atual),
      parcelas_total: Number(form.parcelas_total),
      juros_mensal: Number(form.juros_mensal),
    });

    if (!error) router.push("/financeiro/admin/endividamento");
    else alert("Erro ao salvar");
  }

  useEffect(() => {
    carregarInstituicoes();
  }, []);

  function update(k: string, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="px-6 py-8 space-y-8">

      <div className="bg-[#112240] border border-cyan-500/20 shadow-md rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-cyan-300">
          Novo Endividamento
        </h2>

        <div className="grid mt-6 gap-4 md:grid-cols-2">

          <div>
            <label className="text-cyan-300 text-sm">Instituição</label>
            <select
              value={form.instituicao_id}
              onChange={(e) => update("instituicao_id", e.target.value)}
              className="w-full p-2 rounded bg-[#0D1B2A] border border-cyan-500/20 text-white"
            >
              <option value="">Selecione...</option>
              {instituicoes.map((i) => (
                <option key={i.id} value={i.id}>{i.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-cyan-300 text-sm">Modalidade</label>
            <input
              type="text"
              value={form.modalidade}
              onChange={(e) => update("modalidade", e.target.value)}
              className="w-full p-2 rounded bg-[#0D1B2A] border border-cyan-500/20 text-white"
            />
          </div>

          <div>
            <label className="text-cyan-300 text-sm">Valor Total</label>
            <input
              type="number"
              value={form.valor_total}
              onChange={(e) => update("valor_total", e.target.value)}
              className="w-full p-2 rounded bg-[#0D1B2A] border border-cyan-500/20 text-white"
            />
          </div>

          <div>
            <label className="text-cyan-300 text-sm">Saldo Atual</label>
            <input
              type="number"
              value={form.saldo_devedor}
              onChange={(e) => update("saldo_devedor", e.target.value)}
              className="w-full p-2 rounded bg-[#0D1B2A] border border-cyan-500/20 text-white"
            />
          </div>

          <div>
            <label className="text-cyan-300 text-sm">Parcela Atual</label>
            <input
              type="number"
              value={form.parcela_atual}
              onChange={(e) => update("parcela_atual", e.target.value)}
              className="w-full p-2 rounded bg-[#0D1B2A] border border-cyan-500/20 text-white"
            />
          </div>

          <div>
            <label className="text-cyan-300 text-sm">Total Parcelas</label>
            <input
              type="number"
              value={form.parcelas_total}
              onChange={(e) => update("parcelas_total", e.target.value)}
              className="w-full p-2 rounded bg-[#0D1B2A] border border-cyan-500/20 text-white"
            />
          </div>

          <div>
            <label className="text-cyan-300 text-sm">Juros Mensal (%)</label>
            <input
              type="number"
              value={form.juros_mensal}
              onChange={(e) => update("juros_mensal", e.target.value)}
              className="w-full p-2 rounded bg-[#0D1B2A] border border-cyan-500/20 text-white"
            />
          </div>

          <div>
            <label className="text-cyan-300 text-sm">Vencimento</label>
            <input
              type="date"
              value={form.vencimento}
              onChange={(e) => update("vencimento", e.target.value)}
              className="w-full p-2 rounded bg-[#0D1B2A] border border-cyan-500/20 text-white"
            />
          </div>

        </div>

        <button
          onClick={salvar}
          className="mt-6 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 text-white rounded"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
