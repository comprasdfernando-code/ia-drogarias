"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function brl(v: any) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdminAgenda() {
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("finance_agenda")
      .select("*")
      .order("tipo", { ascending: true })
      .order("dia_mes", { ascending: true });

    if (!error && data) setDados(data);
    setLoading(false);
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from("finance_agenda").update({ ativo: !ativo }).eq("id", id);
    carregar();
  }

  async function excluir(id: string) {
    if (!confirm("Deseja realmente excluir este item da agenda?")) return;
    await supabase.from("finance_agenda").delete().eq("id", id);
    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  if (loading) return <p className="text-white p-4">Carregando...</p>;

  return (
    <div className="px-6 py-8 space-y-8">
      <div className="bg-[#112240] border border-cyan-500/20 shadow-md rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-cyan-300">Admin — Agenda (Fer)</h2>
        <p className="text-slate-400 text-sm mt-1">Cadastre entradas e saídas recorrentes por dia do mês</p>
      </div>

      <div className="bg-[#0D1B2A] border border-cyan-500/20 rounded-2xl p-6 shadow">
        <h3 className="text-lg font-medium text-cyan-300 mb-4">Itens da Agenda</h3>

        <table className="w-full text-left text-white">
          <thead className="text-cyan-400 border-b border-cyan-500/20">
            <tr>
              <th className="py-2">Tipo</th>
              <th className="py-2">Dia</th>
              <th className="py-2">Título</th>
              <th className="py-2">Categoria</th>
              <th className="py-2">Valor</th>
              <th className="py-2">Ativo</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((i) => (
              <tr key={i.id} className="border-b border-cyan-500/10">
                <td className={`py-2 font-semibold ${i.tipo === "entrada" ? "text-emerald-300" : "text-amber-300"}`}>
                  {i.tipo}
                </td>
                <td className="py-2">{String(i.dia_mes).padStart(2, "0")}</td>
                <td className="py-2">{i.titulo}</td>
                <td className="py-2 text-slate-300">{i.categoria}</td>
                <td className="py-2 font-semibold">{brl(i.valor)}</td>
                <td className="py-2">
                  <span className={i.ativo ? "text-emerald-300" : "text-slate-500"}>{i.ativo ? "Sim" : "Não"}</span>
                </td>
                <td className="py-2 flex gap-4">
                  <button
                    onClick={() => toggleAtivo(i.id, i.ativo)}
                    className="text-cyan-400 hover:text-cyan-200"
                  >
                    {i.ativo ? "Desativar" : "Ativar"}
                  </button>

                  <button onClick={() => excluir(i.id)} className="text-red-400 hover:text-red-300">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-xs text-slate-500 mt-4">
          *Agora você consegue ligar/desligar itens (ex: Luís quitação) sem apagar.
        </p>
      </div>
    </div>
  );
}
