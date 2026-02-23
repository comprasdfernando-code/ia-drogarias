"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../../_lib/clinic";

type Documento = {
  id: string;
  titulo: string;
  conteudo_snapshot: string;
  status: string;
  paciente_id: string;
  pacientes?: {
    nome: string;
  } | null;
};

export default function DocumentoAssinaturaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [doc, setDoc] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);
  const [aceite, setAceite] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("doc_pacientes")
        .select(`
          id, titulo, conteudo_snapshot, status, paciente_id,
          pacientes:paciente_id (nome)
        `)
        .eq("id", id)
        .eq("clinica_slug", CLINICA_SLUG)
        .single();

      if (error) {
        alert(error.message);
        router.push("/clinicas/dradudarodrigues/documentos");
        return;
      }

      setDoc(data as any);
      setLoading(false);
    }

    if (id) load();
  }, [id, router]);

  async function confirmar() {
    if (!doc) return;
    if (!aceite) {
      alert("É necessário marcar que leu e concorda.");
      return;
    }

    setSaving(true);

    try {
      await supabase
        .from("doc_pacientes")
        .update({
          status: "assinado",
          aceite: true,
          assinado_at: new Date().toISOString(),
          assinado_nome: doc.pacientes?.nome || "",
          assinado_user_agent: navigator.userAgent,
        })
        .eq("id", doc.id);

      alert("Documento assinado ✅");
      router.push("/clinicas/dradudarodrigues/documentos");
    } catch (e: any) {
      alert("Erro ao assinar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-slate-300">Carregando…</div>;
  if (!doc) return null;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xl font-semibold">{doc.titulo}</div>
        <div className="text-sm text-slate-400">
          Paciente: {doc.pacientes?.nome}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 whitespace-pre-line text-sm text-slate-200">
        {doc.conteudo_snapshot}
      </div>

      {doc.status === "assinado" ? (
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/30 p-4 text-emerald-200">
          Documento já assinado ✅
        </div>
      ) : (
        <div className="space-y-4">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={aceite}
              onChange={(e) => setAceite(e.target.checked)}
              className="h-4 w-4"
            />
            Declaro que li e concordo com os termos acima.
          </label>

          <button
            onClick={confirmar}
            disabled={saving}
            className="rounded-xl bg-slate-100 px-6 py-2 font-semibold text-slate-900 hover:bg-white disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Confirmar assinatura"}
          </button>
        </div>
      )}
    </div>
  );
}