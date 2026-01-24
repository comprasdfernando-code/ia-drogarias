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
  // pode existir ou não na tabela
  taxa_locomocao?: number | null;
  ativo?: boolean | null;
};

export default function AgendaClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const servicoURLRaw = searchParams.get("servico") || "";

  // ✅ CORREÇÃO PRINCIPAL: decodifica e normaliza o nome do serviço
  const servicoNome = useMemo(() => {
    try {
      return normalizeSpaces(decodeURIComponent(servicoURLRaw));
    } catch {
      return normalizeSpaces(servicoURLRaw);
    }
  }, [servicoURLRaw]);

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

  // ✅ Busca valores do serviço (match exato + fallback ilike com % %)
  useEffect(() => {
    let alive = true;

    async function load() {
      if (!servicoNome) {
        setCatalogo(null);
        return;
      }

      setLoadingCatalogo(true);

      try {
        // 1) tenta buscar com taxa_locomocao (se existir) + ativo
        const exactWithTaxaActive = async () =>
          supabase
            .from("servicos_catalogo")
            .select("nome,preco,taxa_locomocao,ativo")
            .eq("ativo", true)
            .eq("nome", servicoNome)
            .maybeSingle();

        // 2) fallback se coluna taxa_locomocao não existir
        const exactNoTaxaActive = async () =>
          supabase
            .from("servicos_catalogo")
            .select("nome,preco,ativo")
            .eq("ativo", true)
            .eq("nome", servicoNome)
            .maybeSingle();

        // 3) fallback se coluna ativo não existir
        const exactWithTaxa = async () =>
          supabase
            .from("servicos_catalogo")
            .select("nome,preco,taxa_locomocao")
            .eq("nome", servicoNome)
            .maybeSingle();

        const exactNoTaxa = async () =>
          supabase
            .from("servicos_catalogo")
            .select("nome,preco")
            .eq("nome", servicoNome)
            .maybeSingle();

        // 4) fallback ilike (caso o texto da URL esteja um pouco diferente)
        const ilikeWithTaxaActive = async () =>
          supabase
            .from("servicos_catalogo")
            .select("nome,preco,taxa_locomocao,ativo")
            .eq("ativo", true)
            .ilike("nome", `%${servicoNome}%`)
            .order("nome", { ascending: true })
            .limit(1)
            .maybeSingle();

        const ilikeNoTaxaActive = async () =>
          supabase
            .from("servicos_catalogo")
            .select("nome,preco,ativo")
            .eq("ativo", true)
            .ilike("nome", `%${servicoNome}%`)
            .order("nome", { ascending: true })
            .limit(1)
            .maybeSingle();

        const ilikeWithTaxa = async () =>
          supabase
            .from("servicos_catalogo")
            .select("nome,preco,taxa_locomocao")
            .ilike("nome", `%${servicoNome}%`)
            .order("nome", { ascending: true })
            .limit(1)
            .maybeSingle();

        const ilikeNoTaxa = async () =>
          supabase
            .from("servicos_catalogo")
            .select("nome,preco")
            .ilike("nome", `%${servicoNome}%`)
            .order("nome", { ascending: true })
            .limit(1)
            .maybeSingle();

        // ✅ 1) tenta buscar EXATO (prioridade)
let data: any = null;
let error: any = null;

const nomeBusca = servicoNome; // já decodificado e normalizado

// tenta com 'ativo' primeiro (se existir)
let r = await supabase
  .from("servicos_catalogo")
  .select("nome,preco,ativo")
  .eq("ativo", true)
  .eq("nome", nomeBusca)
  .maybeSingle();

data = r.data;
error = r.error;

// se a coluna 'ativo' não existir, refaz sem ela (sem quebrar)
if (error?.code === "42703" && String(error?.message || "").includes("ativo")) {
  r = await supabase
    .from("servicos_catalogo")
    .select("nome,preco")
    .eq("nome", nomeBusca)
    .maybeSingle();

  data = r.data;
  error = r.error;
}

// ✅ 2) se não achou no EXATO, tenta ILIKE com % % (pega diferenças no texto)
if (!error && !data) {
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

  // se 'ativo' não existir, refaz sem ele
  if (error?.code === "42703" && String(error?.message || "").includes("ativo")) {
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

// agora você usa data?.preco normalmente
if (error) {
  console.error("ERRO CATALOGO:", error);
  setCatalogo(null);
} else {
  setCatalogo(data ? (data as any) : null);
}


        setCatalogo((data as CatalogoServico) ?? null);
      } finally {
        if (alive) setLoadingCatalogo(false);
      }
    }

    load();
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

  function validate() {
    if (!form.nome.trim()) return "Informe seu nome.";
    if (onlyDigits(form.telefone).length < 10) return "WhatsApp inválido (DDD + número).";
    if (!form.servico.trim()) return "Serviço inválido.";
    if (!form.data) return "Selecione a data.";
    if (!form.horario) return "Selecione o horário.";
    return "";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
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
        taxa_locomocao: taxaLocomocao, // sempre tem fallback
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

        setForm({
          nome: "",
          telefone: "",
          endereco: "",
          servico: servicoNome,
          data: todayISO(),
          horario: "",
          observacoes: "",
        });
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

  const gotoSolicitar = () => {
    if (!servicoNome) {
      toast.error("Serviço inválido na URL.", { position: "top-center", autoClose: 2500, theme: "colored" });
      return;
    }
    router.push(`/servicos/solicitar?servico=${encodeURIComponent(servicoNome)}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold tracking-tight text-slate-900">IA Drogarias</div>
          <div className="text-xs text-slate-500">Agendamento de Serviços</div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-slate-900">Agendar atendimento</h1>
            <p className="mt-1 text-sm text-slate-600">
              Preencha os dados e escolha o melhor horário. Confirmação via WhatsApp.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Seu nome</label>
                <input
                  name="nome"
                  type="text"
                  placeholder="Nome completo"
                  value={form.nome}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
                  required
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
                  required
                />
                <div className="mt-1 text-xs text-slate-500">Digite com DDD.</div>
              </div>
            </div>

            <div>
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

            <div>
              <label className="text-xs font-semibold text-slate-700">Serviço</label>
              <input
                name="servico"
                type="text"
                value={form.servico}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border bg-slate-100 px-3 py-3 text-sm text-slate-700"
                readOnly
              />
              {!servicoNome ? (
                <div className="mt-1 text-xs text-rose-600">
                  Atenção: nenhum serviço veio na URL. Ex.: <b>?servico=Aferição%20de%20Pressão%20Arterial</b>
                </div>
              ) : null}
            </div>

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

            <div className="rounded-2xl border bg-slate-50 p-3">
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
              <div className="mt-2 text-xs text-slate-500">
                Você pode usar os botões ou digitar no campo “Horário”.
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Observações</label>
              <textarea
                name="observacoes"
                placeholder="Ex.: preferir tarde, ponto de referência, detalhes do pedido..."
                value={form.observacoes}
                onChange={handleChange}
                className="mt-1 min-h-[90px] w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
              />
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

            <div className="text-center text-xs text-slate-500">
              IA Drogarias • intermediação entre paciente e profissionais
            </div>
          </form>
        </div>

        <aside className="lg:sticky lg:top-20">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Resumo do agendamento</div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Serviço</span>
                <span className="font-semibold text-slate-900">{form.servico || "—"}</span>
              </div>

              <div className="mt-3 rounded-2xl border bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-700">Valor estimado</div>

                {loadingCatalogo ? (
                  <div className="mt-2 text-xs text-slate-500">Carregando valores…</div>
                ) : catalogo ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Serviço</span>
                      <span className="font-semibold">{`R$ ${(precoServico ?? 0).toFixed(2).replace(".", ",")}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Locomoção (ida/volta)</span>
                      <span className="font-semibold">{`R$ ${(taxaLocomocao ?? 0).toFixed(2).replace(".", ",")}`}</span>
                    </div>
                    <div className="mt-2 flex justify-between border-t pt-2">
                      <span className="text-slate-700">Total</span>
                      <span className="text-slate-900 font-bold">{`R$ ${total.toFixed(2).replace(".", ",")}`}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      * Valores do catálogo (se cadastrado). Atendimento “Solicitar agora” usa esses valores.
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-500">Sem valores no catálogo para esse serviço.</div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Data</span>
                <span className="font-semibold text-slate-900">{form.data || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Horário</span>
                <span className="font-semibold text-slate-900">{form.horario || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Cliente</span>
                <span className="font-semibold text-slate-900">{form.nome || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">WhatsApp</span>
                <span className="font-semibold text-slate-900">{onlyDigits(form.telefone) ? onlyDigits(form.telefone) : "—"}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={gotoSolicitar}
              className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
            >
              Solicitar agora
            </button>

            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
              Depois de enviar, o profissional/central confirma com você pelo WhatsApp.
            </div>
          </div>
        </aside>
      </div>

      <ToastContainer />
    </main>
  );
}
