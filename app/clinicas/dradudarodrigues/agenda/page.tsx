"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../_lib/clinic";
import { DUDA_THEME } from "../_lib/theme";

type AgendaEvento = {
  id: string;
  clinica_slug: string;
  paciente_id: string;

  titulo: string;
  descricao: string | null;

  data: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM:SS (ou HH:MM)
  hora_fim: string | null;

  status: string; // agendado | confirmado | concluido | faltou | cancelado
  valor: number | null;

  created_at: string;
  updated_at: string;

  pacientes?: {
    id: string;
    nome: string;
    telefone: string | null;
  } | null;
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function padHM(t: string) {
  if (!t) return "—";
  return t.slice(0, 5);
}

function brl(v: number | null) {
  if (v == null) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusPill(status: string) {
  const s = (status || "").toLowerCase();
  const base =
    "inline-flex items-center rounded-full border px-3 py-1 text-xs md:text-sm font-semibold";

  // mantendo a paleta dentro do rosé/dourado (sem neon)
  if (s === "confirmado")
    return `${base} border-[#b9f6c7]/20 bg-emerald-950/25 text-emerald-100`;
  if (s === "concluido")
    return `${base} border-sky-300/15 bg-sky-950/25 text-sky-100`;
  if (s === "faltou")
    return `${base} border-amber-300/15 bg-amber-950/25 text-amber-100`;
  if (s === "cancelado")
    return `${base} border-rose-300/15 bg-rose-950/25 text-rose-100`;

  // agendado
  return `${base} border-[#f2caa2]/20 bg-[#050208]/45 text-[#f2caa2]`;
}

export default function AgendaPage() {
  const [dia, setDia] = useState<string>(todayISO());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<AgendaEvento[]>([]);

  const diaFmt = useMemo(() => {
    try {
      const d = new Date(`${dia}T00:00:00`);
      return d.toLocaleDateString("pt-BR", { dateStyle: "full" });
    } catch {
      return dia;
    }
  }, [dia]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase
        .from("agenda_eventos")
        .select(
          `
          *,
          pacientes:paciente_id (
            id, nome, telefone
          )
        `
        )
        .eq("clinica_slug", CLINICA_SLUG)
        .eq("data", dia)
        .order("hora_inicio", { ascending: true });

      if (error) throw error;

      setItems((data || []) as any);
    } catch (e: any) {
      setErr(e?.message || "Erro ao carregar agenda.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dia]);

  function shiftDay(delta: number) {
    const d = new Date(`${dia}T00:00:00`);
    d.setDate(d.getDate() + delta);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setDia(`${yyyy}-${mm}-${dd}`);
  }

  return (
    <div className="space-y-5">
      {/* topo */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className={DUDA_THEME.h1}>Agenda</div>
          <div className={DUDA_THEME.muted}>
            {diaFmt} {loading ? "• Carregando…" : ""}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => shiftDay(-1)} className={DUDA_THEME.btnGhost} disabled={loading}>
            ← Dia anterior
          </button>

          <input
            type="date"
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            className={DUDA_THEME.input}
            style={{ maxWidth: 190 }}
          />

          <button onClick={() => setDia(todayISO())} className={DUDA_THEME.btnGhost} disabled={loading}>
            Hoje
          </button>

          <button onClick={() => shiftDay(1)} className={DUDA_THEME.btnGhost} disabled={loading}>
            Próximo dia →
          </button>

          <Link href="/clinicas/dradudarodrigues/agenda/novo" className={DUDA_THEME.btnPrimary}>
            + Novo agendamento
          </Link>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-950/30 p-4 text-base text-rose-100">
          {err}
        </div>
      )}

      <div className={`rounded-2xl p-5 ${DUDA_THEME.surface}`}>
        <div className={DUDA_THEME.tableWrap}>
          <table className="w-full">
            <thead className={DUDA_THEME.tableHead}>
              <tr>
                <th className="px-4 py-3 text-left">Horário</th>
                <th className="px-4 py-3 text-left">Paciente</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Título</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f2caa2]/10">
              {items.map((ev) => (
                <tr key={ev.id} className={DUDA_THEME.tableRow}>
                  <td className={DUDA_THEME.tableCell}>
                    <div className="font-semibold text-base md:text-lg">
                      {padHM(ev.hora_inicio)}
                      {ev.hora_fim ? `–${padHM(ev.hora_fim)}` : ""}
                    </div>
                    <div className="text-sm md:text-base text-slate-300">{brl(ev.valor)}</div>
                  </td>

                  <td className={DUDA_THEME.tableCell}>
                    <div className="font-semibold text-base md:text-lg">
                      {ev.pacientes?.nome || "Paciente"}
                    </div>
                    <div className="text-sm md:text-base text-slate-300">
                      {ev.pacientes?.telefone || "—"}
                    </div>
                  </td>

                  <td className={`${DUDA_THEME.tableCellMuted} hidden lg:table-cell`}>
                    <div className="font-semibold text-slate-100">{ev.titulo}</div>
                    {ev.descricao ? (
                      <div className="text-sm text-slate-300 line-clamp-1">{ev.descricao}</div>
                    ) : null}
                  </td>

                  <td className="px-4 py-3">
                    <span className={statusPill(ev.status)}>{ev.status}</span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Link href={`/clinicas/dradudarodrigues/agenda/${ev.id}`} className={DUDA_THEME.btnGhost}>
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-base text-slate-300">
                    Nenhum agendamento para este dia.
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

        <div className="mt-4 text-sm md:text-base text-slate-300">
          Dica: use <b className="text-[#f2caa2]">Confirmado</b> quando o paciente responder, e{" "}
          <b className="text-[#f2caa2]">Concluído</b> ao finalizar o atendimento.
        </div>
      </div>
    </div>
  );
}