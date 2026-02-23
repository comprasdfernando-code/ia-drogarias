"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../_lib/clinic";

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
  const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]";
  if (s === "assinado") return `${base} border-emerald-900/40 bg-emerald-950/30 text-emerald-200`;
  if (s === "cancelado") return `${base} border-rose-900/40 bg-rose-950/30 text-rose-200`;
  return `${base} border-amber-900/40 bg-amber-950/30 text-amber-200`; // pendente
}

export default function DocumentosPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [status, setStatus] = useState<"todos" | "pendente" | "assinado" | "cancelado">("pendente");
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

      // filtro local por nome/título (rápido e simples)
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
    <div className="space-y-4">
      {/* topo */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xl font-semibold">Documentos</div>
          <div className="text-sm text-slate-300">
            Termos e consentimentos do paciente (MVP com checkbox).
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={carregar}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Atualizando…" : "Atualizar"}
          </button>

          <Link
            href="/clinicas/dradudarodrigues/documentos/modelos"
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
          >
            Modelos
          </Link>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/30 p-3 text-sm text-rose-200">
          {err}
        </div>
      )}

      {/* filtros */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["todos", "pendente", "assinado", "cancelado"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={[
                  "rounded-xl border px-3 py-2 text-xs",
                  status === s
                    ? "border-slate-500 bg-slate-100 text-slate-900"
                    : "border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900",
                ].join(" ")}
              >
                {s}
              </button>
            ))}
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por paciente ou título…"
            className="w-full md:max-w-md rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>

        {/* tabela */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/60 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left">Documento</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Paciente</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left hidden lg:table-cell">Criado</th>
                <th className="px-3 py-2 text-left hidden lg:table-cell">Assinado</th>
                <th className="px-3 py-2 text-right">Ação</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {items.map((d) => (
                <tr key={d.id} className="bg-slate-900/10">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-100">{d.titulo}</div>
                    <div className="text-xs text-slate-400">
                      #{d.id.slice(0, 8)} • {d.assinado_nome ? `Ass.: ${d.assinado_nome}` : "—"}
                    </div>
                  </td>

                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="font-semibold text-slate-100">{d.pacientes?.nome || "—"}</div>
                    <div className="text-xs text-slate-400">{d.pacientes?.telefone || "—"}</div>
                  </td>

                  <td className="px-3 py-3">
                    <span className={badgeClass(d.status)}>{d.status}</span>
                  </td>

                  <td className="px-3 py-3 hidden lg:table-cell text-slate-200">
                    {fmtDateTime(d.created_at)}
                  </td>

                  <td className="px-3 py-3 hidden lg:table-cell text-slate-200">
                    {fmtDateTime(d.assinado_at)}
                  </td>

                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`/clinicas/dradudarodrigues/documentos/${d.id}`}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                    Nenhum documento encontrado.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-400">
                    Carregando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-slate-400">
          Dica: gere documentos pelo paciente (vamos colocar o botão “Gerar termo” no perfil do paciente).
        </div>
      </div>
    </div>
  );
}