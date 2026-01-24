"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

type Profissional = {
  slug: string;
  nome: string | null;
  foto_url: string | null;
  categoria: string | null;
  whatsapp: string | null;
};

type Servico = {
  id: string;
  profissional_slug: string;
  nome: string | null;
  duracao_min: number | null;
  preco: number | null;
};

type AgendamentoExistente = {
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysISO(baseISO: string, days: number) {
  const d = new Date(baseISO + "T00:00:00");
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dayLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function buildSlots(startHHMM = "08:00", endHHMM = "20:00", stepMin = 30) {
  const [sh, sm] = startHHMM.split(":").map(Number);
  const [eh, em] = endHHMM.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  const slots: string[] = [];
  for (let t = start; t <= end; t += stepMin) {
    const h = String(Math.floor(t / 60)).padStart(2, "0");
    const m = String(t % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

export default function AgendamentoProfissionalPage() {
  const params = useParams<{ profissional: string }>();
  const router = useRouter();
  const profissionalSlug = params?.profissional;

  const [loading, setLoading] = useState(true);
  const [prof, setProf] = useState<Profissional | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [ocupados, setOcupados] = useState<AgendamentoExistente[]>([]);

  // fluxo
  const [servicoId, setServicoId] = useState<string>("");
  const [dataISO, setDataISO] = useState<string>(todayISO());
  const [hora, setHora] = useState<string>("");

  // cliente
  const [clienteNome, setClienteNome] = useState("");
  const [clienteWhats, setClienteWhats] = useState("");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const servicoSel = useMemo(
    () => servicos.find((s) => s.id === servicoId) || null,
    [servicos, servicoId]
  );

  const dias = useMemo(() => {
    const start = todayISO();
    return Array.from({ length: 10 }).map((_, i) => addDaysISO(start, i));
  }, []);

  const slots = useMemo(() => buildSlots("08:00", "20:00", 30), []);

  const ocupadoSet = useMemo(() => {
    const set = new Set<string>();
    ocupados
      .filter((o) => o.data === dataISO)
      .forEach((o) => set.add(o.hora));
    return set;
  }, [ocupados, dataISO]);

  const whatsLink = useMemo(() => {
    const w = onlyDigits(prof?.whatsapp || "");
    if (!w) return "";
    const text = encodeURIComponent(
      `Oi! Vim pelo IA Drogarias e quero agendar com ${prof?.nome || "você"}.\n` +
        `Serviço: ${servicoSel?.nome || "-"}\n` +
        `Data: ${dataISO}\n` +
        `Horário: ${hora || "-"}\n` +
        `Meu nome: ${clienteNome || "-"}`
    );
    return `https://wa.me/${w}?text=${text}`;
  }, [prof?.whatsapp, prof?.nome, servicoSel?.nome, dataISO, hora, clienteNome]);

  async function loadBase() {
    if (!profissionalSlug) return;

    setLoading(true);
    setToast(null);

    const { data: p, error: pErr } = await supabase
      .from("profissionais")
      .select("slug,nome,foto_url,categoria,whatsapp")
      .eq("slug", profissionalSlug)
      .maybeSingle();

    if (pErr || !p) {
      setProf(null);
      setServicos([]);
      setOcupados([]);
      setLoading(false);
      setToast({ type: "err", msg: "Profissional não encontrado." });
      return;
    }

    const { data: s, error: sErr } = await supabase
      .from("servicos")
      .select("id,profissional_slug,nome,duracao_min,preco")
      .eq("profissional_slug", profissionalSlug)
      .order("nome", { ascending: true });

    const { data: a, error: aErr } = await supabase
      .from("agendamentos")
      .select("data,hora")
      .eq("profissional_slug", profissionalSlug)
      .in("status", ["pendente", "confirmado"]);

    setProf(p as Profissional);
    setServicos((sErr ? [] : (s || [])) as Servico[]);
    setOcupados((aErr ? [] : (a || [])) as AgendamentoExistente[]);
    setLoading(false);
  }

  useEffect(() => {
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profissionalSlug]);

  useEffect(() => {
    // reset horário ao trocar data/serviço
    setHora("");
  }, [dataISO, servicoId]);

  function canSubmit() {
    if (!profissionalSlug) return false;
    if (!servicoId) return false;
    if (!dataISO) return false;
    if (!hora) return false;
    if (!clienteNome.trim()) return false;
    if (onlyDigits(clienteWhats).length < 10) return false;
    if (ocupadoSet.has(hora)) return false;
    return true;
  }

  async function confirmarAgendamento() {
    if (!canSubmit() || saving) return;
    setSaving(true);
    setToast(null);

    const payload = {
      profissional_slug: profissionalSlug,
      servico_id: servicoId,
      data: dataISO,
      hora,
      cliente_nome: clienteNome.trim(),
      cliente_whatsapp: onlyDigits(clienteWhats),
      status: "pendente",
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("agendamentos").insert(payload);

    if (error) {
      setSaving(false);
      setToast({ type: "err", msg: "Não foi possível salvar. Tenta de novo." });
      return;
    }

    setSaving(false);
    setToast({ type: "ok", msg: "Agendamento enviado! Agora é só aguardar a confirmação." });

    // opcional: levar pra página de sucesso
    router.push(`/agendamento/${profissionalSlug}/sucesso`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* top bar */}
      <div className="sticky top-0 z-30 border-b bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-sm font-semibold tracking-tight text-slate-900">
            IA Drogarias
          </Link>
          <div className="text-xs text-slate-500">
            Agendamento {prof?.nome ? `• ${prof.nome}` : ""}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* header prof */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-slate-100">
                {prof?.foto_url ? (
                  <Image src={prof.foto_url} alt="Foto" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    foto
                  </div>
                )}
              </div>

              <div>
                <div className="text-base font-semibold text-slate-900">
                  {loading ? "Carregando..." : prof?.nome || "Profissional"}
                </div>
                <div className="text-sm text-slate-600">{prof?.categoria || "Atendimento"}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {prof?.whatsapp ? (
                <a
                  className="rounded-xl border px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  href={`https://wa.me/${onlyDigits(prof.whatsapp)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              ) : null}
              <div className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                Agende em 1 minuto
              </div>
            </div>
          </div>
        </div>

        {/* layout */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          {/* esquerda */}
          <div className="space-y-6">
            {/* passo 1 - serviço */}
            <section className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">1) Escolha o serviço</h2>
                <span className="text-xs text-slate-500">{servicos.length} opções</span>
              </div>

              {loading ? (
                <div className="text-sm text-slate-500">Carregando serviços...</div>
              ) : servicos.length === 0 ? (
                <div className="text-sm text-slate-500">Nenhum serviço cadastrado.</div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {servicos.map((s) => {
                    const active = s.id === servicoId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setServicoId(s.id)}
                        className={[
                          "rounded-2xl border p-3 text-left transition",
                          active ? "border-slate-900 bg-slate-50" : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="text-sm font-semibold text-slate-900">
                          {s.nome || "Serviço"}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                          <span>{s.duracao_min ? `${s.duracao_min} min` : "—"}</span>
                          <span>•</span>
                          <span>{typeof s.preco === "number" ? formatBRL(s.preco) : "Consultar"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* passo 2 - data */}
            <section className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">2) Selecione a data</h2>
                <span className="text-xs text-slate-500">Próximos 10 dias</span>
              </div>

              <div className="flex gap-2 overflow-auto pb-1">
                {dias.map((d) => {
                  const active = d === dataISO;
                  return (
                    <button
                      key={d}
                      onClick={() => setDataISO(d)}
                      className={[
                        "shrink-0 rounded-2xl border px-3 py-2 text-sm font-medium transition",
                        active ? "border-slate-900 bg-slate-50 text-slate-900" : "hover:bg-slate-50 text-slate-700",
                      ].join(" ")}
                    >
                      {dayLabel(d)}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* passo 3 - hora */}
            <section className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">3) Escolha o horário</h2>
                <span className="text-xs text-slate-500">
                  {ocupados.filter((o) => o.data === dataISO).length} ocupados
                </span>
              </div>

              {!servicoId ? (
                <div className="text-sm text-slate-500">Escolha um serviço para liberar os horários.</div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-4">
                  {slots.map((h) => {
                    const isBusy = ocupadoSet.has(h);
                    const active = hora === h;

                    return (
                      <button
                        key={h}
                        disabled={isBusy}
                        onClick={() => setHora(h)}
                        className={[
                          "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                          isBusy ? "cursor-not-allowed bg-slate-100 text-slate-400" : "hover:bg-slate-50 text-slate-800",
                          active ? "border-slate-900 bg-slate-50" : "",
                        ].join(" ")}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* passo 4 - dados */}
            <section className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">4) Seus dados</h2>
                <span className="text-xs text-slate-500">para confirmar o contato</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Seu nome</label>
                  <input
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    placeholder="Ex.: Fernando"
                    className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">WhatsApp</label>
                  <input
                    value={clienteWhats}
                    onChange={(e) => setClienteWhats(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
                  />
                  <div className="mt-1 text-xs text-slate-500">
                    mínimo 10 dígitos (DDD + número)
                  </div>
                </div>
              </div>
            </section>

            {/* ações */}
            <section className="rounded-2xl border bg-white p-4 shadow-sm">
              {toast ? (
                <div
                  className={[
                    "mb-3 rounded-2xl border px-3 py-2 text-sm",
                    toast.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800",
                  ].join(" ")}
                >
                  {toast.msg}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={confirmarAgendamento}
                  disabled={!canSubmit() || saving}
                  className={[
                    "w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition",
                    !canSubmit() || saving ? "bg-slate-300 cursor-not-allowed" : "bg-slate-900 hover:opacity-95",
                  ].join(" ")}
                >
                  {saving ? "Salvando..." : "Confirmar agendamento"}
                </button>

                {prof?.whatsapp ? (
                  <a
                    href={whatsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full rounded-2xl border px-4 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    Chamar no WhatsApp
                  </a>
                ) : null}
              </div>

              <div className="mt-3 text-xs text-slate-500">
                Ao confirmar, seu agendamento fica como <b>pendente</b> até o profissional aceitar.
              </div>
            </section>
          </div>

          {/* direita - resumo */}
          <aside className="lg:sticky lg:top-20">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Resumo</h3>

              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Profissional</span>
                  <span className="font-semibold text-slate-900">{prof?.nome || "—"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Serviço</span>
                  <span className="font-semibold text-slate-900">{servicoSel?.nome || "—"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Data</span>
                  <span className="font-semibold text-slate-900">{dataISO || "—"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Horário</span>
                  <span className="font-semibold text-slate-900">{hora || "—"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Valor</span>
                  <span className="font-semibold text-slate-900">
                    {typeof servicoSel?.preco === "number" ? formatBRL(servicoSel.preco) : "—"}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                Dica: se o cliente travar, o resumo ajuda a “segurar” a decisão.
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-10 pb-10 text-center text-xs text-slate-400">
          IA Drogarias • Intermediação entre paciente e profissional
        </div>
      </div>
    </div>
  );
}
