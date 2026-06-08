"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

function toISODate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

export default function HistoricoPage() {
  const today = useMemo(() => new Date(), []);
  const [ini, setIni] = useState(toISODate(new Date(today.getTime() - 6*24*3600*1000)));
  const [fim, setFim] = useState(toISODate(today));
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;
    if (!uid) return;

    const iniTs = new Date(`${ini}T00:00:00`).toISOString();
    const fimTs = new Date(`${fim}T23:59:59`).toISOString();

    const { data, error } = await supabase
      .from("saude_medicoes")
      .select("*")
      .eq("user_id", uid)
      .gte("medido_em", iniTs)
      .lte("medido_em", fimTs)
      .order("medido_em", { ascending: false });

    setLoading(false);
    if (error) return alert(error.message);
    setRows((data || []) as Row[]);
  }

  useEffect(() => { carregar(); }, []); // eslint-disable-line

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Histórico</h1>
        <Link className="rounded-xl border px-3 py-2 text-sm" href="/saude">Voltar</Link>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-700">Início</label>
            <input type="date" className="mt-1 w-full rounded-xl border p-3" value={ini} onChange={(e)=>setIni(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-700">Fim</label>
            <input type="date" className="mt-1 w-full rounded-xl border p-3" value={fim} onChange={(e)=>setFim(e.target.value)} />
          </div>
        </div>

        <button onClick={carregar} disabled={loading}
          className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-white disabled:opacity-60">
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((r) => {
          const dt = new Date(r.medido_em);
          const when = dt.toLocaleString("pt-BR");
          const title = r.tipo === "glicemia"
            ? `Glicemia: ${r.valor1} mg/dL`
            : `Pressão: ${r.valor1}/${r.valor2}`;

          return (
            <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium text-slate-900">{title}</div>
                <div className="text-xs text-slate-500">{when}</div>
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {r.tipo === "glicemia" ? (r.contexto ? `Momento: ${r.contexto}` : "") : (r.pulso ? `Pulso: ${r.pulso}` : "")}
              </div>
              {r.observacao ? <div className="mt-2 text-sm text-slate-700">Obs: {r.observacao}</div> : null}
            </div>
          );
        })}

        {!loading && rows.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-600">Nenhuma medição no período.</div>
        )}
      </div>
    </div>
  );
}