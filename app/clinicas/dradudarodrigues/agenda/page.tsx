"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../_lib/clinic";

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

  // join
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
  // supabase pode retornar HH:MM:SS
  return t.slice(0, 5);
}

function statusBadge(status: string) {
  const s = (status || "").toLowerCase();
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]";
  if (s === "confirmado")
    return `${base} border-emerald-900/40 bg-emerald-950/30 text-emerald-200`;
  if (s === "concluido")
    return `${base} border-sky-900/40 bg-sky-950/30 text-sky-200`;
  if (s === "faltou")
    return `${base} border-amber-900/40 bg-amber-950/30 text-amber-200`;
  if (s === "cancelado")
    return `${base} border-rose-900/40 bg-rose-950/30 text-rose-200`;
  return `${base} border-slate-700 bg-slate-950 text-slate-200`;
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xl font-semibold">Agenda</div>
          <div className="text-sm text-slate-300">
            {diaFmt} {loading ? "• Carregando…" : ""}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => shiftDay(-1)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900"
            disabled={loading}
          >
            ← Dia anterior
          </button>

          <input
            type="date"
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-slate-500"
          />

          <button
            onClick={() => setDia(todayISO())}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900"
            disabled={loading}
          >
            Hoje
          </button>

          <button
            onClick={() => shiftDay(1)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900"
            disabled={loading}
          >
            Próximo dia →
          </button>

          <Link
            href="/clinicas/dradudarodrigues/agenda/novo"
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-white"
          >
            + Novo agendamento
          </Link>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/30 p-3 text-sm text-rose-200">
          {err}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-4">
        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/60 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left">Horário</th>
                <th className="px-3 py-2 text-left">Paciente</th>
                <th className="px-3 py-2 text-left hidden lg:table-cell">
                  Título
                </th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Ação</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {items.map((ev) => (
                <tr key={ev.id} className="bg-slate-900/10">
                  <td className="px-3 py-3 text-slate-200">
                    <div className="font-semibold">
                      {padHM(ev.hora_inicio)}
                      {ev.hora_fim ? `–${padHM(ev.hora_fim)}` : ""}
                    </div>
                    <div className="text-xs text-slate-400">
                      {ev.valor != null
                        ? Number(ev.valor).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "—"}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-100">
                      {ev.pacientes?.nome || "Paciente"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {ev.pacientes?.telefone || "—"}
                    </div>
                  </td>

                  <td className="px-3 py-3 hidden lg:table-cell text-slate-200">
                    {ev.titulo}
                    {ev.descricao ? (
                      <div className="text-xs text-slate-400 line-clamp-1">
                        {ev.descricao}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-3 py-3">
                    <span className={statusBadge(ev.status)}>{ev.status}</span>
                  </td>

                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`/clinicas/dradudarodrigues/agenda/${ev.id}`}
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
                    Nenhum agendamento para este dia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-slate-400">
          Dica: use <b>Confirmado</b> quando o paciente responder, e <b>Concluído</b> ao finalizar o atendimento.
        </div>
      </div>
    </div>
  );
}