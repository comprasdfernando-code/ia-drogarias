"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabase } from "@/lib/supabaseClient";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildSlots(start = "08:00", end = "20:00", stepMin = 30) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  const out: string[] = [];
  for (let t = startMin; t <= endMin; t += stepMin) {
    const h = String(Math.floor(t / 60)).padStart(2, "0");
    const m = String(t % 60).padStart(2, "0");
    out.push(`${h}:${m}`);
  }
  return out;
}

function normalizeSpaces(s: string) {
  return (s || "").replace(/\s+/g, " ").trim();
}

const TAXA_LOCOMOCAO_PADRAO = 20;

type CatalogoServico = {
  nome: string | null;
  preco: number | null;
  taxa_locomocao?: number | null;
  ativo?: boolean | null;
};

type Mode = "imediato" | "agendar";

export default function AgendaClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const servicoURLRaw = searchParams.get("servico") || "";

  const servicoNome = useMemo(() => {
    try {
      return normalizeSpaces(decodeURIComponent(servicoURLRaw));
    } catch {
      return normalizeSpaces(servicoURLRaw);
    }
  }, [servicoURLRaw]);

  const [mode, setMode] = useState<Mode>("imediato");
  const [openAgendar, setOpenAgendar] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    servico: "",
    data: todayISO(),
    horario: "",
    observacoes: "",
  });

  const [sending, setSending] = useState(false);
  const [catalogo, setCatalogo] = useState<CatalogoServico | null>(null);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);

  const slots = useMemo(() => buildSlots("08:00", "20:00", 30), []);

  useEffect(() => {
    if (servicoNome) setForm((p) => ({ ...p, servico: servicoNome }));
  }, [servicoNome]);

  // ✅ Busca valores do serviço (EXATO -> ILIKE; lida com colunas ausentes)
  useEffect(() => {
    let alive = true;

    async function run() {
      if (!servicoNome) {
        if (alive) setCatalogo(null);
        return;
      }

      if (alive) setLoadingCatalogo(true);

      try {
        let data: any = null;
        let error: any = null;

        const nomeBusca = servicoNome;

        // --------- 1) EXATO com ativo + taxa
        let r = await supabase
          .from("servicos_catalogo")
          .select("nome,preco,taxa_locomocao,ativo")
          .eq("ativo", true)
          .eq("nome", nomeBusca)
          .maybeSingle();

        data = r.data;
        error = r.error;

        // taxa_locomocao não existe -> refaz sem taxa
        if (error?.code === "42703" && String(error?.message || "").includes("taxa_locomocao")) {
          r = await supabase
            .from("servicos_catalogo")
            .select("nome,preco,ativo")
            .eq("ativo", true)
            .eq("nome", nomeBusca)
            .maybeSingle();

          data = r.data;
          error = r.error;
        }

        // ativo não existe -> refaz sem ativo (com taxa se existir)
        if (error?.code === "42703" && String(error?.message || "").includes("ativo")) {
          r = await supabase.from("servicos_catalogo").select("nome,preco,taxa_locomocao").eq("nome", nomeBusca).maybeSingle();

          data = r.data;
          error = r.error;

          // se ainda der taxa_locomocao não existe
          if (error?.code === "42703" && String(error?.message || "").includes("taxa_locomocao")) {
            r = await supabase.from("servicos_catalogo").select("nome,preco").eq("nome", nomeBusca).maybeSingle();
            data = r.data;
            error = r.error;
          }
        }

        // --------- 2) Se não achou no exato, tenta ILIKE
        if (!error && !data) {
          r = await supabase
            .from("servicos_catalogo")
            .select("nome,preco,taxa_locomocao,ativo")
            .eq("ativo", true)
            .ilike("nome", `%${nomeBusca}%`)
            .order("nome", { ascending: true })
            .limit(1)
            .maybeSingle();

          data = r.data;
          error = r.error;

          // taxa_locomocao não existe
          if (error?.code === "42703" && String(error?.message || "").includes("taxa_locomocao")) {
            r = await supabase
              .from("servicos_catalogo")
              .select("nome,preco,ativo")
              .eq("ativo", true)
              .ilike("nome", `%${nomeBusca}%`)
              .order("nome", { ascending: true })
              .limit(1)
              .maybeSingle();

            data = r.data;
            error = r.error;
          }

          // ativo não existe
          if (error?.code === "42703" && String(error?.message || "").includes("ativo")) {
            r = await supabase
              .from("servicos_catalogo")
              .select("nome,preco,taxa_locomocao")
              .ilike("nome", `%${nomeBusca}%`)
              .order("nome", { ascending: true })
              .limit(1)
              .maybeSingle();

            data = r.data;
            error = r.error;

            // taxa também não existe
            if (error?.code === "42703" && String(error?.message || "").includes("taxa_locomocao")) {
              r = await supabase
                .from("servicos_catalogo")
                .select("nome,preco")
                .ilike("nome", `%${nomeBusca}%`)
                .order("nome", { ascending: true })
                .limit(1)
                .maybeSingle();

              data = r.data;
              error = r.error;
            }
          }
        }

        if (error) {
          console.error("ERRO CATALOGO:", error);
          if (alive) setCatalogo(null);
        } else {
          if (alive) setCatalogo(data ? (data as CatalogoServico) : null);
        }
      } finally {
        if (alive) setLoadingCatalogo(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [servicoNome]);

  const precoServico = useMemo(() => {
    const n = Number(catalogo?.preco ?? 0);
    return Number.isFinite(n) ? n : 0;
  }, [catalogo]);

  const taxaLocomocao = useMemo(() => {
    const v = catalogo?.taxa_locomocao;
    if (v === null || v === undefined) return TAXA_LOCOMOCAO_PADRAO;
    const n = Number(v);
    return Number.isFinite(n) ? n : TAXA_LOCOMOCAO_PADRAO;
  }, [catalogo]);

  const total = useMemo(() => precoServico + taxaLocomocao, [precoServico, taxaLocomocao]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  function validateBase() {
    if (!form.nome.trim()) return "Informe seu nome.";
    if (onlyDigits(form.telefone).length < 10) return "WhatsApp inválido (DDD + número).";
    if (!form.servico.trim()) return "Serviço inválido.";
    return "";
  }

  function validateAgendar() {
    const base = validateBase();
    if (base) return base;
    if (!form.data) return "Selecione a data.";
    if (!form.horario) return "Selecione o horário.";
    return "";
  }

  const gotoSolicitar = () => {
    if (!servicoNome) {
      toast.error("Serviço inválido na URL.", { position: "top-center", autoClose: 2500, theme: "colored" });
      return;
    }
    router.push(`/servicos/solicitar?servico=${encodeURIComponent(servicoNome)}`);
  };

  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault();

    const err = validateAgendar();
    if (err) {
      toast.error(err, { position: "top-center", autoClose: 3000, theme: "colored" });
      return;
    }

    setSending(true);

    try {
      const payload = {
        ...form,
        servico: servicoNome || form.servico,
        telefone: onlyDigits(form.telefone),

        preco_servico: catalogo ? precoServico : null,
        taxa_locomocao: taxaLocomocao,
        total: catalogo ? total : taxaLocomocao,
      };

      const response = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        toast.success(`Agendamento enviado para ${form.data} às ${form.horario}!`, {
          position: "top-center",
          autoClose: 3000,
          theme: "colored",
        });

        setForm((p) => ({
          ...p,
          data: todayISO(),
          horario: "",
          observacoes: "",
        }));
        setOpenAgendar(false);
        setMode("imediato");
      } else {
        console.error("API error:", result);
        toast.error("❌ Erro ao salvar agendamento. Tente novamente.", {
          position: "top-center",
          autoClose: 4000,
          theme: "colored",
        });
      }
    } catch (error) {
      console.error("Erro no envio:", error);
      toast.error("⚠️ Erro de conexão com o servidor.", {
        position: "top-center",
        autoClose: 4000,
        theme: "colored",
      });
    } finally {
      setSending(false);
    }
  };

  const resumoPreco = (
    <div className="mt-3 rounded-2xl border bg-slate-50 p-3">
      <div className="text-xs font-semibold text-slate-700">Valor estimado</div>

      {loadingCatalogo ? (
        <div className="mt-2 text-xs text-slate-500">Carregando valores…</div>
      ) : catalogo ? (
        <div className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Serviço</span>
            <span className="font-semibold">{`R$ ${precoServico.toFixed(2).replace(".", ",")}`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Locomoção (ida/volta)</span>
            <span className="font-semibold">{`R$ ${taxaLocomocao.toFixed(2).replace(".", ",")}`}</span>
          </div>
          <div className="mt-2 flex justify-between border-t pt-2">
            <span className="text-slate-700">Total</span>
            <span className="text-slate-900 font-bold">{`R$ ${total.toFixed(2).replace(".", ",")}`}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">* Valores do catálogo (se cadastrado).</div>
        </div>
      ) : (
        <div className="mt-2 text-xs text-slate-500">Sem valores no catálogo para esse serviço.</div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold tracking-tight text-slate-900">IA Drogarias</div>
          <div className="text-xs text-slate-500">Solicitação de Serviços</div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-slate-900">{servicoNome || "Serviço"}</h1>
            <p className="text-sm text-slate-600">
              Escolha <b>Solicitar agora</b> (mais rápido) ou, se preferir, agende um horário.
            </p>
          </div>

          {/* CAMPOS BASE (para ambos) */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">Seu nome</label>
              <input
                name="nome"
                type="text"
                placeholder="Nome completo"
                value={form.nome}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">WhatsApp</label>
              <input
                name="telefone"
                type="text"
                placeholder="(11) 99999-9999"
                value={form.telefone}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
              />
              <div className="mt-1 text-xs text-slate-500">Digite com DDD.</div>
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs font-semibold text-slate-700">Endereço (se for atendimento domiciliar)</label>
            <input
              name="endereco"
              type="text"
              placeholder="Rua, número, bairro, complemento"
              value={form.endereco}
              onChange={handleChange}
              className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div className="mt-3">
            <label className="text-xs font-semibold text-slate-700">Observações</label>
            <input
              name="observacoes"
              type="text"
              placeholder="Ex.: preferência de horário, ponto de referência..."
              value={form.observacoes}
              onChange={handleChange}
              className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
            />
          </div>

          {!servicoNome ? (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              Atenção: nenhum serviço veio na URL. Ex.: <b>?servico=Aferição%20de%20Pressão%20Arterial</b>
            </div>
          ) : null}

          {/* PRINCIPAL: SOLICITAR AGORA */}
          <div className="mt-5 rounded-2xl border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Primeira opção</div>
                <div className="mt-1 text-xs text-slate-600">
                  Atendimento o quanto antes. A central/profissional confirma com você pelo WhatsApp.
                </div>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Recomendado
              </span>
            </div>

            {resumoPreco}

            <button
              type="button"
              onClick={() => {
                const baseErr = validateBase();
                if (baseErr) {
                  toast.error(baseErr, { position: "top-center", autoClose: 3000, theme: "colored" });
                  return;
                }
                setMode("imediato");
                gotoSolicitar();
              }}
              className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
            >
              Solicitar agora
            </button>

            <div className="mt-3 text-center text-[11px] text-slate-500">
              IA Drogarias • intermediação entre paciente e profissionais
            </div>
          </div>

          {/* SECUNDÁRIO: AGENDAR (DISCRETO / COLAPSÁVEL) */}
          <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
            <button
              type="button"
              onClick={() => {
                setMode("agendar");
                setOpenAgendar((v) => !v);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 shadow-sm"
            >
              <span>Agendar por hora marcada (opcional)</span>
              <span className="text-xs font-semibold text-slate-500">{openAgendar ? "Fechar" : "Abrir"}</span>
            </button>

            {openAgendar ? (
              <form onSubmit={handleAgendar} className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Data</label>
                    <input
                      name="data"
                      type="date"
                      value={form.data}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Horário</label>
                    <input
                      name="horario"
                      type="time"
                      value={form.horario}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-3">
                  <div className="mb-2 text-xs font-semibold text-slate-700">Sugestões de horário</div>
                  <div className="grid gap-2 sm:grid-cols-6">
                    {slots.map((h) => {
                      const active = form.horario === h;
                      return (
                        <button
                          type="button"
                          key={h}
                          onClick={() => setForm((p) => ({ ...p, horario: h }))}
                          className={[
                            "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                            active ? "border-slate-900 bg-white" : "bg-white hover:bg-slate-100",
                          ].join(" ")}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Você pode usar os botões ou digitar no campo “Horário”.</div>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className={[
                    "w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition",
                    sending ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:opacity-95",
                  ].join(" ")}
                >
                  {sending ? "Enviando..." : "Confirmar Agendamento"}
                </button>

                <div className="text-xs text-slate-600">
                  Depois de enviar, o profissional/central confirma com você pelo WhatsApp.
                </div>
              </form>
            ) : (
              <div className="mt-3 text-xs text-slate-600">
                Quer escolher um horário específico? Clique em <b>Abrir</b> para agendar.
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer />
    </main>
  );
}
