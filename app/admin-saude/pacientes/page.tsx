"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type V = {
  id: string;
  user_id: string;
  drogaria_id: string;
  nivel_acesso: "relatorios"|"continuo";
  status: "pendente"|"ativo"|"revogado";
  created_at: string;
};

export default function AdminPacientesPage() {
  const [rows, setRows] = useState<V[]>([]);
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("saude_vinculos")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);
    if (error) return alert(error.message);
    setRows((data || []) as V[]);
  }

  useEffect(() => { carregar(); }, []);

  async function setStatus(id: string, status: V["status"]) {
    const { error } = await supabase.from("saude_vinculos").update({ status }).eq("id", id);
    if (error) return alert(error.message);
    carregar();
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pacientes</h1>
        <Link className="rounded-xl border px-3 py-2 text-sm" href="/admin-saude">Voltar</Link>
      </div>

      {loading ? <div className="p-6 text-sm text-slate-600">Carregando…</div> : null}

      <div className="space-y-2">
        {rows.map((v) => (
          <div key={v.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-700">
              <div><b>Paciente:</b> {v.user_id}</div>
              <div><b>Nível:</b> {v.nivel_acesso}</div>
              <div><b>Status:</b> {v.status}</div>
            </div>

            <div className="mt-3 flex gap-2">
              <Link className="flex-1 rounded-xl border px-3 py-2 text-center text-sm"
                href={`/admin-saude/paciente/${v.user_id}`}>
                Abrir
              </Link>

              {v.status !== "ativo" && (
                <button className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white"
                  onClick={() => setStatus(v.id, "ativo")}>
                  Aprovar
                </button>
              )}

              {v.status !== "revogado" && (
                <button className="flex-1 rounded-xl bg-rose-600 px-3 py-2 text-sm text-white"
                  onClick={() => setStatus(v.id, "revogado")}>
                  Revogar
                </button>
              )}
            </div>
          </div>
        ))}

        {!loading && rows.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-600">Nenhum vínculo ainda.</div>
        )}
      </div>
    </div>
  );
}