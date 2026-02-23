"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CLINICA_SLUG } from "../../_lib/clinic";
import { DUDA_THEME } from "../../_lib/theme";

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
  const [loadingPacientes, setLoadingPacientes] = useState(false);

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
      setLoadingPacientes(true);

      const { data, error } = await supabase
        .from("pacientes")
        .select("id,nome,telefone")
        .eq("clinica_slug", CLINICA_SLUG)
        .order("nome", { ascending: true })
        .limit(600);

      if (!alive) return;

      setLoadingPacientes(false);

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
    if (!q) return pacientes.slice(0, 40);
    return pacientes
      .filter((p) => p.nome.toLowerCase().includes(q) || (p.telefone || "").includes(q))
      .slice(0, 40);
  }, [pacientes, qPaciente]);

  async function salvar() {
    if (!pacienteId) return alert("Selecione um paciente.");
    if (!titulo.trim()) return alert("Informe um título.");
    if (!data) return alert("Informe a data.");
    if (!horaInicio) return alert("Informe a hora de início.");

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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className={DUDA_THEME.h1}>Novo agendamento</div>
          <div className={DUDA_THEME.muted}>
            Selecione o paciente e defina data/horário.
          </div>
        </div>

        <button onClick={() => router.back()} className={DUDA_THEME.btnGhost} disabled={saving}>
          Voltar
        </button>
      </div>

      <div className={`rounded-2xl p-6 ${DUDA_THEME.surface}`}>
        <div className="grid gap-5 md:grid-cols-2">
          {/* paciente */}
          <div className="md:col-span-2">
            <label className="text-base md:text-lg font-semibold text-slate-100">
              Paciente <span className="text-[#f2caa2]">*</span>
            </label>

            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <input
                value={qPaciente}
                onChange={(e) => setQP(e.target.value)}
                className={DUDA_THEME.input}
                placeholder="Buscar paciente por nome ou telefone…"
              />

              <select
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                className={DUDA_THEME.input}
              >
                <option value="">
                  {loadingPacientes ? "Carregando pacientes…" : "Selecionar…"}
                </option>
                {pacientesFiltrados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {p.telefone ? `• ${p.telefone}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2 text-sm md:text-base text-slate-300">
              * Mostrando até 40 resultados. Digite para filtrar.
            </div>
          </div>

          {/* título */}
          <div className="md:col-span-2">
            <label className="text-base md:text-lg font-semibold text-slate-100">
              Título <span className="text-[#f2caa2]">*</span>
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className={`${DUDA_THEME.input} mt-2`}
              placeholder="Ex: Avaliação, Retorno, Botox…"
            />
          </div>

          {/* data */}
          <div>
            <label className="text-base md:text-lg font-semibold text-slate-100">
              Data <span className="text-[#f2caa2]">*</span>
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className={`${DUDA_THEME.input} mt-2`}
            />
          </div>

          {/* horas */}
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-base md:text-lg font-semibold text-slate-100">
                Início <span className="text-[#f2caa2]">*</span>
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className={`${DUDA_THEME.input} mt-2`}
              />
            </div>
            <div>
              <label className="text-base md:text-lg font-semibold text-slate-100">
                Fim
              </label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className={`${DUDA_THEME.input} mt-2`}
              />
            </div>
          </div>

          {/* status */}
          <div>
            <label className="text-base md:text-lg font-semibold text-slate-100">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`${DUDA_THEME.input} mt-2`}
            >
              <option value="agendado">agendado</option>
              <option value="confirmado">confirmado</option>
              <option value="concluido">concluido</option>
              <option value="faltou">faltou</option>
              <option value="cancelado">cancelado</option>
            </select>
          </div>

          {/* valor */}
          <div>
            <label className="text-base md:text-lg font-semibold text-slate-100">
              Valor (opcional)
            </label>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className={`${DUDA_THEME.input} mt-2`}
              placeholder="Ex: 250,00"
            />
          </div>

          {/* observações */}
          <div className="md:col-span-2">
            <label className="text-base md:text-lg font-semibold text-slate-100">
              Observações
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={5}
              className={`${DUDA_THEME.input} mt-2`}
              placeholder="Notas internas do atendimento…"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            onClick={() => router.back()}
            className={DUDA_THEME.btnGhost}
            disabled={saving}
          >
            Voltar
          </button>

          <button onClick={salvar} className={DUDA_THEME.btnPrimary} disabled={saving}>
            {saving ? "Salvando…" : "Salvar agendamento"}
          </button>
        </div>
      </div>
    </div>
  );
}