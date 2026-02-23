"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../../../../_lib/clinic";

type PacienteLite = { id: string; nome: string };
type Modelo = { id: string; titulo: string; conteudo: string; ativo: boolean };

function todayBR() {
  const d = new Date();
  return d.toLocaleDateString("pt-BR");
}

function applyVars(texto: string, vars: Record<string, string>) {
  let out = String(texto || "");
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, v);
  }
  return out;
}

export default function GerarDocumentoPacientePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pacienteId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [paciente, setPaciente] = useState<PacienteLite | null>(null);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [modeloId, setModeloId] = useState<string>("");

  const modeloSelecionado = useMemo(
    () => modelos.find((m) => m.id === modeloId) || null,
    [modelos, modeloId]
  );

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const { data: p, error: eP } = await supabase
          .from("pacientes")
          .select("id,nome")
          .eq("id", pacienteId)
          .eq("clinica_slug", CLINICA_SLUG)
          .single();

        if (eP) throw eP;

        const { data: ms, error: eM } = await supabase
          .from("doc_modelos")
          .select("id,titulo,conteudo,ativo")
          .eq("clinica_slug", CLINICA_SLUG)
          .eq("ativo", true)
          .order("created_at", { ascending: false })
          .limit(200);

        if (eM) throw eM;

        if (!alive) return;
        setPaciente(p as any);
        setModelos((ms || []) as any);
        setModeloId((ms?.[0]?.id as string) || "");
      } catch (e: any) {
        alert(e?.message || "Erro ao carregar.");
        router.push(`/clinicas/dradudarodrigues/pacientes/${pacienteId}`);
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (pacienteId) load();
    return () => {
      alive = false;
    };
  }, [pacienteId, router]);

  async function gerar() {
    if (!paciente) return;
    if (!modeloSelecionado) {
      alert("Selecione um modelo.");
      return;
    }

    setSaving(true);
    try {
      const vars = {
        NOME: paciente.nome,
        DATA: todayBR(),
      };

      const snapshot = applyVars(modeloSelecionado.conteudo, vars);

      const payload = {
        clinica_slug: CLINICA_SLUG,
        paciente_id: paciente.id,
        modelo_id: modeloSelecionado.id,
        titulo: modeloSelecionado.titulo,
        conteudo_snapshot: snapshot,
        status: "pendente",
      };

      const { data: created, error } = await supabase
        .from("doc_pacientes")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      router.push(`/clinicas/dradudarodrigues/documentos/${created.id}`);
    } catch (e: any) {
      alert(e?.message || "Erro ao gerar documento.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-slate-300">Carregando…</div>;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Gerar documento</div>
        <div className="text-sm text-slate-300">
          Paciente: <span className="text-slate-100 font-semibold">{paciente?.nome}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
        <div>
          <label className="text-sm text-slate-300">Modelo</label>
          <select
            value={modeloId}
            onChange={(e) => setModeloId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
          >
            {modelos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.titulo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-sm text-slate-300 mb-2">Prévia (com variáveis aplicadas)</div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 whitespace-pre-line text-sm text-slate-200">
            {modeloSelecionado
              ? applyVars(modeloSelecionado.conteudo, {
                  NOME: paciente?.nome || "",
                  DATA: todayBR(),
                })
              : "Selecione um modelo…"}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Variáveis disponíveis: {"{NOME}"} e {"{DATA}"}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900 disabled:opacity-60"
            disabled={saving}
          >
            Voltar
          </button>

          <button
            onClick={gerar}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Gerando…" : "Gerar documento"}
          </button>
        </div>
      </div>
    </div>
  );
}