"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../_lib/clinic";
import type { Paciente } from "../_lib/types";
import { DUDA_THEME } from "../_lib/theme";

function fmtDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [totalPacientes, setTotalPacientes] = useState<number>(0);
  const [ultimosPacientes, setUltimosPacientes] = useState<Paciente[]>([]);

  // placeholders (mas já aparecem bonitos)
  const [agendamentosHoje] = useState<number>(0);
  const [documentosPendentes] = useState<number>(0);
  const [receitaMes] = useState<number>(0);

  const receitaMesFmt = useMemo(
    () => receitaMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    [receitaMes]
  );

  async function carregar() {
    setLoading(true);
    setErr(null);

    try {
      // total pacientes
      const { count, error: eCount } = await supabase
        .from("pacientes")
        .select("id", { count: "exact", head: true })
        .eq("clinica_slug", CLINICA_SLUG);

      if (eCount) throw eCount;

      // últimos pacientes
      const { data: recents, error: eRecent } = await supabase
        .from("pacientes")
        .select("*")
        .eq("clinica_slug", CLINICA_SLUG)
        .order("created_at", { ascending: false })
        .limit(5);

      if (eRecent) throw eRecent;

      setTotalPacientes(count || 0);
      setUltimosPacientes((recents || []) as Paciente[]);
    } catch (e: any) {
      setErr(e?.message || "Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      {/* topo */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className={DUDA_THEME.h1}>Dashboard</div>
          <div className={DUDA_THEME.muted}>Visão geral da clínica (dados em tempo real).</div>
        </div>

        <div className="flex gap-2">
          <button onClick={carregar} className={DUDA_THEME.btnGhost} disabled={loading}>
            {loading ? "Atualizando…" : "Atualizar"}
          </button>

          <Link
            href="/clinicas/dradudarodrigues/pacientes/novo"
            className={DUDA_THEME.btnPrimary}
          >
            + Novo paciente
          </Link>
        </div>
      </div>

      {/* banner */}
      <div className={`rounded-2xl p-6 ${DUDA_THEME.surfaceStrong}`}>
        <div className="text-xl md:text-2xl font-semibold">Bem-vindo 👋</div>
        <div className={`mt-2 ${DUDA_THEME.muted}`}>
          Aqui vamos centralizar pacientes, agenda, prontuário, documentos e automações.
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-950/30 p-4 text-base text-rose-100">
            {err}
          </div>
        )}
      </div>

      {/* cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <CardStat
          title="Pacientes"
          value={loading ? "…" : String(totalPacientes)}
          hint="Total cadastrados"
          href="/clinicas/dradudarodrigues/pacientes"
          tag="AO VIVO"
        />

        <CardStat
          title="Agenda (hoje)"
          value={String(agendamentosHoje)}
          hint="agendamentos do dia"
          href="/clinicas/dradudarodrigues/agenda"
          tag="EM BREVE"
        />

        <CardStat
          title="Documentos"
          value={String(documentosPendentes)}
          hint="pendências/assinaturas"
          href="/clinicas/dradudarodrigues/documentos"
          tag="EM BREVE"
        />

        <CardStat
          title="Receita (mês)"
          value={receitaMesFmt}
          hint="financeiro resumido"
          href="/clinicas/dradudarodrigues/financeiro"
          tag="EM BREVE"
        />
      </div>

      {/* últimas atividades */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* últimos pacientes */}
        <div className={`lg:col-span-2 rounded-2xl p-6 ${DUDA_THEME.surface}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={DUDA_THEME.h2}>Últimos pacientes</div>
              <div className={DUDA_THEME.small}>Novos cadastros recentes</div>
            </div>

            <Link href="/clinicas/dradudarodrigues/pacientes" className={DUDA_THEME.btnGhost}>
              Ver todos
            </Link>
          </div>

          <div className={`mt-5 ${DUDA_THEME.tableWrap}`}>
            <table className="w-full">
              <thead className={DUDA_THEME.tableHead}>
                <tr>
                  <th className="px-4 py-3 text-left">Paciente</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Telefone</th>
                  <th className="px-4 py-3 text-left">Criado</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f2caa2]/10">
                {ultimosPacientes.map((p) => (
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

                    <td className={DUDA_THEME.tableCellMuted}>
                      {p.created_at ? fmtDateTime(p.created_at) : "—"}
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

                {!loading && ultimosPacientes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-base text-slate-300">
                      Nenhum paciente cadastrado ainda.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-base text-slate-300">
                      Carregando…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* checklist */}
        <div className={`rounded-2xl p-6 ${DUDA_THEME.surface}`}>
          <div className={DUDA_THEME.h2}>Checklist MVP</div>
          <div className={DUDA_THEME.small}>Próximos blocos pra virar “sistema completo”</div>

          <ul className="mt-5 space-y-3 text-base">
            <li className="flex items-center justify-between rounded-xl border border-[#f2caa2]/15 bg-[#050208]/40 px-4 py-3">
              <span>Pacientes (CRUD)</span>
              <span className="text-emerald-300 font-semibold">OK</span>
            </li>

            <li className="flex items-center justify-between rounded-xl border border-[#f2caa2]/15 bg-[#050208]/40 px-4 py-3">
              <span>Agenda</span>
              <span className="text-slate-200">próximo</span>
            </li>

            <li className="flex items-center justify-between rounded-xl border border-[#f2caa2]/15 bg-[#050208]/40 px-4 py-3">
              <span>Documentos / Assinaturas</span>
              <span className="text-slate-200">depois</span>
            </li>

            <li className="flex items-center justify-between rounded-xl border border-[#f2caa2]/15 bg-[#050208]/40 px-4 py-3">
              <span>Automações (WhatsApp)</span>
              <span className="text-slate-200">depois</span>
            </li>
          </ul>

          <div className="mt-5 text-sm md:text-base text-slate-300">
            * Quando a agenda estiver pronta, esse dashboard já mostra “Agendamentos hoje”.
          </div>
        </div>
      </div>
    </div>
  );
}

function CardStat({
  title,
  value,
  hint,
  href,
  tag,
}: {
  title: string;
  value: string;
  hint: string;
  href: string;
  tag?: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl p-6 transition hover:brightness-[1.03] ${DUDA_THEME.surface}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-base md:text-lg text-slate-200">{title}</div>
        {tag ? <span className={DUDA_THEME.badge}>{tag}</span> : null}
      </div>

      <div className="mt-3 text-3xl md:text-4xl font-semibold">{value}</div>
      <div className="mt-2 text-sm md:text-base text-slate-300">{hint}</div>
    </Link>
  );
}