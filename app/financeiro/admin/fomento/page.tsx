"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Fomento = {
  id: string;
  faturamento_id: string;
  valor_clean: number;
  created_at: string;
};

export default function AdminFomento() {
  const [dados, setDados] = useState<Fomento[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    const { data, error } = await supabase
      .from("finance_fomento")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setDados(data);
    setLoading(false);
  }

  async function excluir(id: string) {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;

    await supabase.from("finance_fomento").delete().eq("id", id);
    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  if (loading) return <p className="text-white p-4">Carregando...</p>;

  return (
    <div className="px-6 py-8 space-y-8">

      {/* TOPO */}
      <div className="bg-[#112240] border border-cyan-500/20 shadow-md rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-cyan-300">
          Admin — Fomento
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Controle de captações (CLEAN).
        </p>

        <Link
          href="/financeiro/admin/fomento/novo"
          className="mt-4 inline-block bg-cyan-600 hover:bg-cyan-700 transition px-4 py-2 rounded text-white"
        >
          + Nova Captação
        </Link>
      </div>

      {/* LISTAGEM */}
      <div className="bg-[#0D1B2A] border border-cyan-500/20 rounded-2xl p-6 shadow">
        <h3 className="text-lg font-medium text-cyan-300 mb-4">
          Captações Registradas
        </h3>

        <table className="w-full text-left text-white">
          <thead className="text-cyan-400 border-b border-cyan-500/20">
            <tr>
              <th className="py-2">Data</th>
              <th className="py-2">Valor CLEAN</th>
              <th className="py-2">ID Faturamento</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>

          <tbody>
            {dados.map((i) => (
              <tr key={i.id} className="border-b border-cyan-500/10">
                <td className="py-2">
                  {new Date(i.created_at).toLocaleDateString("pt-BR")}
                </td>

                <td className="py-2">
                  R$ {Number(i.valor_clean).toLocaleString("pt-BR")}
                </td>

                <td className="py-2">{i.faturamento_id}</td>

                <td className="py-2 flex gap-4">
                  <Link
                    href={`/financeiro/admin/fomento/editar/${i.id}`}
                    className="text-cyan-400 hover:text-cyan-200"
                  >
                    Editar
                  </Link>

                  <button
                    onClick={() => excluir(i.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
