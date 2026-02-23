"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../../_lib/clinic";
import { DUDA_THEME } from "../../_lib/theme";

type Documento = {
  id: string;
  titulo: string;
  conteudo_snapshot: string;
  status: string;
  paciente_id: string;
  pacientes?: { nome: string } | null;
};

function niceTitle(s?: string) {
  return (s || "").trim() || "Documento";
}

export default function DocumentoAssinaturaPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();

  const [doc, setDoc] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);
  const [aceite, setAceite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const alreadySigned = useMemo(() => (doc?.status || "").toLowerCase() === "assinado", [doc]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from("doc_pacientes")
        .select(
          `
          id, titulo, conteudo_snapshot, status, paciente_id,
          pacientes:paciente_id (nome)
        `
        )
        .eq("id", id)
        .eq("clinica_slug", CLINICA_SLUG)
        .single();

      if (!alive) return;

      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }

      setDoc(data as any);
      setLoading(false);
    }

    if (id) load();
    return () => {
      alive = false;
    };
  }, [id]);

  async function confirmar() {
    if (!doc) return;

    if (!aceite) {
      alert("É necessário marcar que leu e concorda.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("doc_pacientes")
        .update({
          status: "assinado",
          aceite: true,
          assinado_at: new Date().toISOString(),
          assinado_nome: doc.pacientes?.nome || "",
          assinado_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        })
        .eq("id", doc.id)
        .eq("clinica_slug", CLINICA_SLUG);

      if (error) throw error;

      alert("Documento assinado ✅");
      router.push("/clinicas/dradudarodrigues/documentos");
    } catch (e: any) {
      alert(e?.message || "Erro ao assinar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-slate-200 text-base">Carregando…</div>;

  if (err) {
    return (
      <div className="space-y-4">
        <div className={DUDA_THEME.h1}>Documento</div>
        <div className="rounded-xl border border-rose-500/25 bg-rose-950/30 p-4 text-base text-rose-100">
          {err}
        </div>
        <button className={DUDA_THEME.btnGhost} onClick={() => router.push("/clinicas/dradudarodrigues/documentos")}>
          Voltar
        </button>
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className={DUDA_THEME.h1}>{niceTitle(doc.titulo)}</div>
          <div className={DUDA_THEME.muted}>
            Paciente: <span className="text-slate-100 font-semibold">{doc.pacientes?.nome || "—"}</span>
          </div>
        </div>

        <button
          onClick={() => router.push("/clinicas/dradudarodrigues/documentos")}
          className={DUDA_THEME.btnGhost}
        >
          Voltar
        </button>
      </div>

      <div className={`rounded-2xl p-6 ${DUDA_THEME.surface}`}>
        <div className="text-base md:text-lg font-semibold text-[#f2caa2] mb-3">
          Conteúdo do termo
        </div>

        <div
          className={[
            "whitespace-pre-line rounded-2xl border",
            "border-[#f2caa2]/15 bg-[#050208]/35",
            "p-5 md:p-6",
            "text-base md:text-lg leading-relaxed text-slate-100",
          ].join(" ")}
        >
          {doc.conteudo_snapshot}
        </div>

        {alreadySigned ? (
          <div className="mt-5 rounded-xl border border-emerald-300/15 bg-emerald-950/25 p-4 text-emerald-100 text-base">
            Documento já assinado ✅
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <label className="flex items-start gap-3 text-base md:text-lg text-slate-100">
              <input
                type="checkbox"
                checked={aceite}
                onChange={(e) => setAceite(e.target.checked)}
                className="mt-1 h-5 w-5 accent-[#f2caa2]"
              />
              <span>
                Declaro que <b className="text-[#f2caa2]">li</b> e{" "}
                <b className="text-[#f2caa2]">concordo</b> com os termos acima.
              </span>
            </label>

            <button
              onClick={confirmar}
              disabled={saving}
              className={DUDA_THEME.btnPrimary}
            >
              {saving ? "Salvando…" : "Confirmar assinatura"}
            </button>

            <div className="text-sm md:text-base text-slate-300">
              * Este aceite marca o documento como <b className="text-[#f2caa2]">assinado</b>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}