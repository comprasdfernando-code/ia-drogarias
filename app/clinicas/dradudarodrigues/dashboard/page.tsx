"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../_lib/clinic";
import type { Paciente } from "../_lib/types";

function fmtDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [totalPacientes, setTotalPacientes] = useState<number>(0);
  const [ultimosPacientes, setUltimosPacientes] = useState<Paciente[]>([]);

  // ✅ Agora agenda hoje é AO VIVO
  const [agendamentosHoje, setAgendamentosHoje] = useState<number>(0);

  // placeholders (a gente conecta quando criar as tabelas)
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
      // 1) total pacientes (count exato)
      const { count, error: eCount } = await supabase
        .from("pacientes")
        .select("id", { count: "exact", head: true })
        .eq("clinica_slug", CLINICA_SLUG);

      if (eCount) throw eCount;

      // 2) últimos pacientes (lista)
      const { data: recents, error: eRecent } = await supabase
        .from("pacientes")
        .select("*")
        .eq("clinica_slug", CLINICA_SLUG)
        .order("created_at", { ascending: false })
        .limit(5);

      if (eRecent) throw eRecent;

      // 3) ✅ agendamentos de hoje (count exato)
      const hoje = todayISO();
      const { count: cAgenda, error: eAgenda } = await supabase
        .from("agenda_eventos")
        .select("id", { count: "exact", head: true })
        .eq("clinica_slug", CLINICA_SLUG)
        .eq("data", hoje);

      if (eAgenda) throw eAgenda;

      setTotalPacientes(count || 0);
      setUltimosPacientes((recents || []) as Paciente[]);
      setAgendamentosHoje(cAgenda || 0);
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
    <div className="space-y-4">
      {/* topo */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xl font-semibold">Dashboard</div>
          <div className="text-sm text-slate-300">
            Visão geral da clínica (dados em tempo real).
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
            href="/clinicas/dradudarodrigues/pacientes/novo"
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
          >
            + Novo paciente
          </Link>
        </div>
      </div>

      {/* banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
        <div className="text-lg font-semibold">Bem-vindo 👋</div>
        <div className="mt-1 text-sm text-slate-300">
          Aqui vamos centralizar pacientes, agenda, prontuário, documentos e automações.
        </div>

        {err && (
          <div className="mt-3 rounded-xl border border-rose-900/40 bg-rose-950/30 p-3 text-sm text-rose-200">
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
          value={loading ? "…" : String(agendamentosHoje)}
          hint="agendamentos do dia"
          href="/clinicas/dradudarodrigues/agenda"
          tag="AO VIVO"
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
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/20 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">Últimos pacientes</div>
              <div className="text-xs text-slate-400">Novos cadastros recentes</div>
            </div>

            <Link
              href="/clinicas/dradudarodrigues/pacientes"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900"
            >
              Ver todos
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-950/60 text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left">Paciente</th>
                  <th className="px-3 py-2 text-left hidden md:table-cell">Telefone</th>
                  <th className="px-3 py-2 text-left">Criado</th>
                  <th className="px-3 py-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {ultimosPacientes.map((p) => (
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
                    <td className="px-3 py-3 text-slate-200">
                      {p.created_at ? fmtDateTime(p.created_at) : "—"}
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

                {!loading && ultimosPacientes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center text-slate-400">
                      Nenhum paciente cadastrado ainda.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center text-slate-400">
                      Carregando…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* checklist MVP */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5">
          <div className="text-base font-semibold">Checklist MVP</div>
          <div className="mt-1 text-xs text-slate-400">
            Próximos blocos pra virar “sistema completo”
          </div>

          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
              <span>Pacientes (CRUD)</span>
              <span className="text-xs text-emerald-300">OK</span>
            </li>

            <li className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
              <span>Agenda</span>
              <span className="text-xs text-emerald-300">OK</span>
            </li>

            <li className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
              <span>Documentos / Assinaturas</span>
              <span className="text-xs text-slate-300">depois</span>
            </li>

            <li className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
              <span>Automações (WhatsApp)</span>
              <span className="text-xs text-slate-300">depois</span>
            </li>
          </ul>

          <div className="mt-4 text-xs text-slate-400">
            * Agora o dashboard já mostra “Agendamentos hoje” em tempo real.
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
      className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 hover:bg-slate-900/30 transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm text-slate-300">{title}</div>
        {tag ? (
          <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] text-slate-200">
            {tag}
          </span>
        ) : null}
      </div>

      <div className="mt-2 text-2xl font-semibold text-slate-100">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{hint}</div>
    </Link>
  );
}