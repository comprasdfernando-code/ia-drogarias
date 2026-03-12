"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  id: string;
  tipo: "glicemia" | "pressao";
  valor1: number;
  valor2: number | null;
  pulso: number | null;
  contexto: string | null;
  observacao: string | null;
  medido_em: string;
};

export default function AdminPacientePage({ params }: { params: { user_id: string } }) {
  const userId = params.user_id;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("saude_medicoes")
      .select("*")
      .eq("user_id", userId)
      .order("medido_em", { ascending: false })
      .limit(100);

    setLoading(false);
    if (error) return alert(error.message); // se não tiver permissão, vai cair aqui
    setRows((data || []) as Row[]);
  }

  useEffect(() => { carregar(); }, []);

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Paciente</h1>
        <Link className="rounded-xl border px-3 py-2 text-sm" href="/admin-saude/pacientes">Voltar</Link>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-sm text-slate-700"><b>User ID:</b> {userId}</div>
        <button onClick={carregar} disabled={loading}
          className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-white disabled:opacity-60">
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((r) => {
          const dt = new Date(r.medido_em).toLocaleString("pt-BR");
          const title = r.tipo === "glicemia"
            ? `Glicemia: ${r.valor1} mg/dL`
            : `Pressão: ${r.valor1}/${r.valor2}`;

          return (
            <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">{title}</div>
                <div className="text-xs text-slate-500">{dt}</div>
              </div>
              {r.observacao ? <div className="mt-2 text-sm text-slate-700">Obs: {r.observacao}</div> : null}
            </div>
          );
        })}
        {!loading && rows.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-600">Sem medições (ou sem acesso contínuo).</div>
        )}
      </div>
    </div>
  );
}