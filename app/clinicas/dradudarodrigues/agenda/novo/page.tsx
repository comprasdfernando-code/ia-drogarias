"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../../_lib/clinic";

type PacienteLite = {
  id: string;
  nome: string;
  telefone: string | null;
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NovoAgendamentoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [pacientes, setPacientes] = useState<PacienteLite[]>([]);
  const [qPaciente, setQP] = useState("");
  const [pacienteId, setPacienteId] = useState("");

  const [titulo, setTitulo] = useState("Consulta / Procedimento");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(todayISO());
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFim, setHoraFim] = useState("");
  const [status, setStatus] = useState("agendado");
  const [valor, setValor] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadPacientes() {
      const { data, error } = await supabase
        .from("pacientes")
        .select("id,nome,telefone")
        .eq("clinica_slug", CLINICA_SLUG)
        .order("nome", { ascending: true })
        .limit(300);

      if (!alive) return;
      if (error) {
        alert(error.message);
        return;
      }
      setPacientes((data || []) as any);
    }

    loadPacientes();
    return () => {
      alive = false;
    };
  }, []);

  const pacientesFiltrados = useMemo(() => {
    const q = qPaciente.trim().toLowerCase();
    if (!q) return pacientes.slice(0, 30);
    return pacientes
      .filter((p) => p.nome.toLowerCase().includes(q) || (p.telefone || "").includes(q))
      .slice(0, 30);
  }, [pacientes, qPaciente]);

  async function salvar() {
    if (!pacienteId) {
      alert("Selecione um paciente.");
      return;
    }
    if (!titulo.trim()) {
      alert("Informe um título.");
      return;
    }
    if (!data) {
      alert("Informe a data.");
      return;
    }
    if (!horaInicio) {
      alert("Informe a hora de início.");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        clinica_slug: CLINICA_SLUG,
        paciente_id: pacienteId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        data,
        hora_inicio: horaInicio.length === 5 ? `${horaInicio}:00` : horaInicio,
        hora_fim: horaFim ? (horaFim.length === 5 ? `${horaFim}:00` : horaFim) : null,
        status,
        valor: valor ? Number(String(valor).replace(",", ".")) : null,
      };

      const { data: created, error } = await supabase
        .from("agenda_eventos")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      router.push(`/clinicas/dradudarodrigues/agenda/${created.id}`);
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar agendamento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Novo agendamento</div>
        <div className="text-sm text-slate-300">
          Selecione o paciente e defina data/horário.
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {/* paciente */}
          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">Paciente *</label>

            <div className="mt-1 grid gap-2 md:grid-cols-2">
              <input
                value={qPaciente}
                onChange={(e) => setQP(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="Buscar paciente por nome ou telefone…"
              />

              <select
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Selecionar…</option>
                {pacientesFiltrados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {p.telefone ? `• ${p.telefone}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-1 text-xs text-slate-400">
              * Mostrando até 30 resultados. Digite para filtrar.
            </div>
          </div>

          {/* dados */}
          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">Título *</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Ex: Avaliação, Retorno, Botox…"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Data *</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-300">Início *</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Fim</label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="agendado">agendado</option>
              <option value="confirmado">confirmado</option>
              <option value="concluido">concluido</option>
              <option value="faltou">faltou</option>
              <option value="cancelado">cancelado</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-300">Valor (opcional)</label>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Ex: 250,00"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">Observações</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Notas internas do atendimento…"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900 disabled:opacity-60"
            disabled={saving}
          >
            Voltar
          </button>

          <button
            onClick={salvar}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Salvando…" : "Salvar agendamento"}
          </button>
        </div>
      </div>
    </div>
  );
}