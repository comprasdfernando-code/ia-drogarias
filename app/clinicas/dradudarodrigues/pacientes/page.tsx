"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../_lib/clinic";
import type { Paciente } from "../_lib/types";
import { DUDA_THEME } from "../_lib/theme";

const PAGE_SIZE = 20;

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

export default function PacientesPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const [items, setItems] = useState<Paciente[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const qNorm = useMemo(() => q.trim(), [q]);
  const qDigits = useMemo(() => onlyDigits(qNorm), [qNorm]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from("pacientes")
          .select("*", { count: "exact" })
          .eq("clinica_slug", CLINICA_SLUG)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (qNorm) {
          const like = `%${qNorm}%`;

          if (qDigits.length >= 6) {
            query = query.or(
              `nome.ilike.${like},cpf.ilike.%${qDigits}%,telefone.ilike.%${qDigits}%`
            );
          } else {
            query = query.ilike("nome", like);
          }
        }

        const { data, count, error } = await query;
        if (error) throw error;

        if (!alive) return;
        setItems((data || []) as Paciente[]);
        setTotal(count || 0);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Erro ao carregar pacientes.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [page, qNorm, qDigits]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      {/* topo */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className={DUDA_THEME.h1}>Pacientes</div>
          <div className={DUDA_THEME.muted}>
            Cadastro e histórico centralizado da clínica.
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/clinicas/dradudarodrigues/pacientes/novo"
            className={DUDA_THEME.btnPrimary}
          >
            + Novo paciente
          </Link>
        </div>
      </div>

      {/* caixa */}
      <div className={`rounded-2xl p-5 ${DUDA_THEME.surface}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar por nome (ou telefone/CPF)…"
            className={`${DUDA_THEME.input} md:max-w-xl`}
          />

          <div className="text-sm md:text-base text-slate-300">
            {loading ? "Carregando…" : `${total} registro(s)`}
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-950/30 p-4 text-base text-rose-100">
            {err}
          </div>
        )}

        {/* tabela */}
        <div className={`mt-5 ${DUDA_THEME.tableWrap}`}>
          <table className="w-full">
            <thead className={DUDA_THEME.tableHead}>
              <tr>
                <th className="px-4 py-3 text-left">Paciente</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Telefone</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">E-mail</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Origem</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f2caa2]/10">
              {items.map((p) => (
                <tr key={p.id} className={DUDA_THEME.tableRow}>
                  <td className={DUDA_THEME.tableCell}>
                    <div className="font-semibold">{p.nome}</div>
                    <div className="text-sm text-slate-300">
                      {p.tags?.length ? p.tags.join(" • ") : "Sem tags"}
                    </div>
                  </td>

                  <td className={`${DUDA_THEME.tableCellMuted} hidden md:table-cell`}>
                    {p.telefone || "—"}
                  </td>

                  <td className={`${DUDA_THEME.tableCellMuted} hidden md:table-cell`}>
                    {p.email || "—"}
                  </td>

                  <td className={`${DUDA_THEME.tableCellMuted} hidden lg:table-cell`}>
                    {p.origem || "—"}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/clinicas/dradudarodrigues/pacientes/${p.id}`}
                      className={DUDA_THEME.btnGhost}
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-base text-slate-300">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-base text-slate-300">
                    Carregando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* paginação */}
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            className={DUDA_THEME.btnGhost}
            disabled={page <= 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ← Anterior
          </button>

          <div className="text-sm md:text-base text-slate-300">
            Página <span className="text-[#f2caa2] font-semibold">{page + 1}</span> de{" "}
            <span className="text-[#f2caa2] font-semibold">{totalPages}</span>
          </div>

          <button
            className={DUDA_THEME.btnGhost}
            disabled={loading || page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima →
          </button>
        </div>
      </div>
    </div>
  );
}