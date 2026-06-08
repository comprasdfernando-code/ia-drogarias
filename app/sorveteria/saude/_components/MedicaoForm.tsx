"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Tipo = "glicemia" | "pressao";

export default function MedicaoForm({ onSaved }: { onSaved?: () => void }) {
  const [tipo, setTipo] = useState<Tipo>("glicemia");
  const [valor1, setValor1] = useState("");
  const [valor2, setValor2] = useState("");
  const [pulso, setPulso] = useState("");
  const [contexto, setContexto] = useState("jejum");
  const [obs, setObs] = useState("");
  const [loading, setLoading] = useState(false);

  const ctxOptions = useMemo(() => ([
    { v: "jejum", t: "Jejum" },
    { v: "pos_prandial", t: "Pós-prandial" },
    { v: "antes_refeicao", t: "Antes da refeição" },
    { v: "antes_dormir", t: "Antes de dormir" },
    { v: "outro", t: "Outro" },
  ]), []);

  async function salvar() {
    const { data: sess } = await supabase.auth.getSession();
    const user = sess.session?.user;
    if (!user) return alert("Sem sessão");

    const v1 = Number(String(valor1).replace(",", "."));
    const v2 = valor2 ? Number(String(valor2).replace(",", ".")) : null;
    const p = pulso ? Number(pulso) : null;

    if (!Number.isFinite(v1)) return alert("Digite um valor válido.");

    if (tipo === "pressao" && (!v2 || !Number.isFinite(v2))) {
      return alert("Para pressão, preencha sistólica e diastólica.");
    }

    setLoading(true);
    const { error } = await supabase.from("saude_medicoes").insert({
      user_id: user.id,
      tipo,
      valor1: v1,
      valor2: tipo === "pressao" ? v2 : null,
      pulso: tipo === "pressao" ? p : null,
      contexto: tipo === "glicemia" ? contexto : null,
      observacao: obs || null,
    });
    setLoading(false);

    if (error) return alert(error.message);

    setValor1(""); setValor2(""); setPulso(""); setObs("");
    onSaved?.();
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex gap-2">
        <button
          className={`flex-1 rounded-xl p-3 text-sm ${tipo==="glicemia" ? "bg-slate-900 text-white" : "border"}`}
          onClick={()=>setTipo("glicemia")}
          type="button"
        >
          Glicemia
        </button>
        <button
          className={`flex-1 rounded-xl p-3 text-sm ${tipo==="pressao" ? "bg-slate-900 text-white" : "border"}`}
          onClick={()=>setTipo("pressao")}
          type="button"
        >
          Pressão
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        {tipo === "glicemia" ? (
          <>
            <div>
              <label className="text-sm text-slate-700">Valor (mg/dL)</label>
              <input className="mt-1 w-full rounded-xl border p-3" value={valor1} onChange={(e)=>setValor1(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-700">Momento</label>
              <select className="mt-1 w-full rounded-xl border p-3" value={contexto} onChange={(e)=>setContexto(e.target.value)}>
                {ctxOptions.map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-700">Sistólica</label>
                <input className="mt-1 w-full rounded-xl border p-3" value={valor1} onChange={(e)=>setValor1(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-slate-700">Diastólica</label>
                <input className="mt-1 w-full rounded-xl border p-3" value={valor2} onChange={(e)=>setValor2(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-700">Pulso (opcional)</label>
              <input className="mt-1 w-full rounded-xl border p-3" value={pulso} onChange={(e)=>setPulso(e.target.value)} />
            </div>
          </>
        )}

        <div>
          <label className="text-sm text-slate-700">Observação (opcional)</label>
          <input className="mt-1 w-full rounded-xl border p-3" value={obs} onChange={(e)=>setObs(e.target.value)} />
        </div>

        <button disabled={loading} onClick={salvar}
          className="rounded-xl bg-emerald-600 px-4 py-3 text-white disabled:opacity-60">
          {loading ? "Salvando…" : "Salvar medição"}
        </button>
      </div>
    </div>
  );
}