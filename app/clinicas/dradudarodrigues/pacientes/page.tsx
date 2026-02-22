"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../_lib/clinic";
import type { Paciente } from "../_lib/types";

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

        // base query (sempre filtra pela clínica)
        let query = supabase
          .from("pacientes")
          .select("*", { count: "exact" })
          .eq("clinica_slug", CLINICA_SLUG)
          .order("created_at", { ascending: false })
          .range(from, to);

        // busca: por nome (ilike) e por telefone/cpf (igual ao digitado, sem máscara)
        // OBS: ilike funciona bem pra nome; telefone/cpf exigem que você armazene com/sem máscara.
        // Aqui vamos fazer: se tiver dígitos, tenta bater em telefone e cpf também.
        if (qNorm) {
          // nome
          const like = `%${qNorm}%`;

          if (qDigits.length >= 6) {
            // tenta nome OU cpf OU telefone
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xl font-semibold">Pacientes</div>
          <div className="text-sm text-slate-300">
            Cadastro e histórico centralizado da clínica.
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/clinicas/dradudarodrigues/pacientes/novo"
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
          >
            + Novo paciente
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar por nome (ou telefone/CPF)…"
            className="w-full md:max-w-lg rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
          />

          <div className="text-xs text-slate-400">
            {loading ? "Carregando…" : `${total} registro(s)`}
          </div>
        </div>

        {err && (
          <div className="mt-3 rounded-xl border border-rose-900/40 bg-rose-950/30 p-3 text-sm text-rose-200">
            {err}
          </div>
        )}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/60 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left">Paciente</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Telefone</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">E-mail</th>
                <th className="px-3 py-2 text-left hidden lg:table-cell">Origem</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {items.map((p) => (
                <tr key={p.id} className="bg-slate-900/10">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-100">{p.nome}</div>
                    <div className="text-xs text-slate-400">
                      {p.tags?.length ? p.tags.join(" • ") : "Sem tags"}
                    </div>
                  </td>

                  <td className="px-3 py-3 hidden md:table-cell text-slate-200">
                    {p.telefone || "—"}
                  </td>

                  <td className="px-3 py-3 hidden md:table-cell text-slate-200">
                    {p.email || "—"}
                  </td>

                  <td className="px-3 py-3 hidden lg:table-cell text-slate-200">
                    {p.origem || "—"}
                  </td>

                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`/clinicas/dradudarodrigues/pacientes/${p.id}`}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-slate-400">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 disabled:opacity-40"
            disabled={page <= 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ← Anterior
          </button>

          <div className="text-xs text-slate-400">
            Página <span className="text-slate-200">{page + 1}</span> de{" "}
            <span className="text-slate-200">{totalPages}</span>
          </div>

          <button
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 disabled:opacity-40"
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