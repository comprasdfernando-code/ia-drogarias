"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../_lib/clinic";
import { DUDA_THEME } from "../_lib/theme";

type DocPaciente = {
  id: string;
  clinica_slug: string;
  paciente_id: string;
  modelo_id: string;

  titulo: string;
  status: string; // pendente | assinado | cancelado
  created_at: string;

  assinado_at: string | null;
  assinado_nome: string | null;

  pacientes?: {
    id: string;
    nome: string;
    telefone: string | null;
  } | null;
};

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function badgeClass(status: string) {
  const s = (status || "").toLowerCase();
  const base =
    "inline-flex items-center rounded-full border px-3 py-1 text-xs md:text-sm font-semibold";

  if (s === "assinado")
    return `${base} border-emerald-300/15 bg-emerald-950/25 text-emerald-100`;
  if (s === "cancelado")
    return `${base} border-rose-300/15 bg-rose-950/25 text-rose-100`;
  return `${base} border-[#f2caa2]/20 bg-[#050208]/45 text-[#f2caa2]`; // pendente
}

export default function DocumentosPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [status, setStatus] = useState<"todos" | "pendente" | "assinado" | "cancelado">(
    "pendente"
  );
  const [q, setQ] = useState("");
  const [items, setItems] = useState<DocPaciente[]>([]);

  const qNorm = useMemo(() => q.trim().toLowerCase(), [q]);

  async function carregar() {
    setLoading(true);
    setErr(null);

    try {
      let query = supabase
        .from("doc_pacientes")
        .select(
          `
          id, clinica_slug, paciente_id, modelo_id, titulo, status, created_at, assinado_at, assinado_nome,
          pacientes:paciente_id (id, nome, telefone)
        `
        )
        .eq("clinica_slug", CLINICA_SLUG)
        .order("created_at", { ascending: false })
        .limit(200);

      if (status !== "todos") query = query.eq("status", status);

      const { data, error } = await query;
      if (error) throw error;

      const arr = (data || []) as any as DocPaciente[];

      const filtered = !qNorm
        ? arr
        : arr.filter((d) => {
            const pn = (d.pacientes?.nome || "").toLowerCase();
            const tt = (d.titulo || "").toLowerCase();
            return pn.includes(qNorm) || tt.includes(qNorm);
          });

      setItems(filtered);
    } catch (e: any) {
      setErr(e?.message || "Erro ao carregar documentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="space-y-5">
      {/* topo */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className={DUDA_THEME.h1}>Documentos</div>
          <div className={DUDA_THEME.muted}>
            Termos e consentimentos do paciente (MVP com checkbox).
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={carregar} className={DUDA_THEME.btnGhost} disabled={loading}>
            {loading ? "Atualizando…" : "Atualizar"}
          </button>

          <Link href="/clinicas/dradudarodrigues/documentos/modelos" className={DUDA_THEME.btnPrimary}>
            Modelos
          </Link>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-950/30 p-4 text-base text-rose-100">
          {err}
        </div>
      )}

      {/* filtros */}
      <div className={`rounded-2xl p-5 ${DUDA_THEME.surface}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["todos", "pendente", "assinado", "cancelado"] as const).map((s) => {
              const active = status === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={[
                    "rounded-xl border px-4 py-2 text-sm md:text-base font-semibold transition",
                    active
                      ? "border-[#f2caa2]/30 bg-[#140a18]/65 text-[#f2caa2]"
                      : "border-[#f2caa2]/15 bg-[#050208]/35 text-slate-200 hover:bg-[#140a18]/45",
                  ].join(" ")}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por paciente ou título…"
            className={`${DUDA_THEME.input} md:max-w-md`}
          />
        </div>

        {/* tabela */}
        <div className={`mt-5 ${DUDA_THEME.tableWrap}`}>
          <table className="w-full">
            <thead className={DUDA_THEME.tableHead}>
              <tr>
                <th className="px-4 py-3 text-left">Documento</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Paciente</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Criado</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Assinado</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f2caa2]/10">
              {items.map((d) => (
                <tr key={d.id} className={DUDA_THEME.tableRow}>
                  <td className={DUDA_THEME.tableCell}>
                    <div className="font-semibold text-base md:text-lg">{d.titulo}</div>
                    <div className="text-sm md:text-base text-slate-300">
                      #{d.id.slice(0, 8)} • {d.assinado_nome ? `Ass.: ${d.assinado_nome}` : "—"}
                    </div>
                  </td>

                  <td className={`${DUDA_THEME.tableCell} hidden md:table-cell`}>
                    <div className="font-semibold text-base md:text-lg">
                      {d.pacientes?.nome || "—"}
                    </div>
                    <div className="text-sm md:text-base text-slate-300">
                      {d.pacientes?.telefone || "—"}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={badgeClass(d.status)}>{d.status}</span>
                  </td>

                  <td className={`${DUDA_THEME.tableCellMuted} hidden lg:table-cell`}>
                    {fmtDateTime(d.created_at)}
                  </td>

                  <td className={`${DUDA_THEME.tableCellMuted} hidden lg:table-cell`}>
                    {fmtDateTime(d.assinado_at)}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Link href={`/clinicas/dradudarodrigues/documentos/${d.id}`} className={DUDA_THEME.btnGhost}>
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-base text-slate-300">
                    Nenhum documento encontrado.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-base text-slate-300">
                    Carregando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm md:text-base text-slate-300">
          Dica: gere documentos pelo paciente (vamos colocar o botão “Gerar termo” no perfil do paciente).
        </div>
      </div>
    </div>
  );
}