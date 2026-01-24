"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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

function brl(v: number) {
  return (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type CatalogoServico = {
  preco_servico: number;
  taxa_locomocao: number;
};

export default function AgendaClient() {
  const searchParams = useSearchParams();
  const servicoURL = searchParams.get("servico") || "";

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

  // horários bonitos (chips)
  const slots = useMemo(() => buildSlots("08:00", "20:00", 30), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (servicoURL) {
      setForm((prev) => ({ ...prev, servico: servicoURL }));
    }
  }, [servicoURL]);

  const servicoNome = useMemo(() => (form.servico || servicoURL || "").trim(), [form.servico, servicoURL]);

  const servicoEncoded = useMemo(() => encodeURIComponent(servicoNome), [servicoNome]);

  // ✅ preço do catálogo
  const [precoLoading, setPrecoLoading] = useState(false);
  const [preco, setPreco] = useState<CatalogoServico>({ preco_servico: 0, taxa_locomocao: 0 });
  const [precoFound, setPrecoFound] = useState<boolean>(true);

  const total = useMemo(() => (preco.preco_servico || 0) + (preco.taxa_locomocao || 0), [preco]);

  // evita “piscar” e chamadas repetidas
  const lastServicoRef = useRef<string>("");

  async function carregarPreco(nomeServico: string) {
    const nome = (nomeServico || "").trim();
    if (!nome) {
      setPreco({ preco_servico: 0, taxa_locomocao: 0 });
      setPrecoFound(true);
      return;
    }

    // evita chamada repetida
    if (lastServicoRef.current === nome) return;
    lastServicoRef.current = nome;

    setPrecoLoading(true);

    const { data, error } = await supabase
      .from("servicos_catalogo")
      .select("preco_servico,taxa_locomocao")
      .eq("nome", nome)
      .eq("ativo", true)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar servico_catalogo:", error);
      setPreco({ preco_servico: 0, taxa_locomocao: 0 });
      setPrecoFound(false);
      setPrecoLoading(false);
      return;
    }

    const ps = Number((data as any)?.preco_servico ?? 0);
    const tl = Number((data as any)?.taxa_locomocao ?? 0);

    setPreco({ preco_servico: ps, taxa_locomocao: tl });
    setPrecoFound(!!data);
    setPrecoLoading(false);
  }

  useEffect(() => {
    // sempre que mudar serviço, busca preço
    lastServicoRef.current = ""; // libera nova busca
    carregarPreco(servicoNome);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicoNome]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  function validate() {
    if (!form.nome.trim()) return "Informe seu nome.";
    if (onlyDigits(form.telefone).length < 10) return "WhatsApp inválido (DDD + número).";
    if (!servicoNome) return "Serviço inválido.";
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
        servico: servicoNome,
        telefone: onlyDigits(form.telefone),

        // ✅ já manda valores (se sua API quiser usar)
        preco_servico: Number(preco.preco_servico ?? 0),
        taxa_locomocao: Number(preco.taxa_locomocao ?? 0),
        total: Number(total ?? 0),
      };

      const response = await fetch("/api/sendMessage", {
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
          servico: servicoURL,
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

  const canSolicitarAgora = servicoNome.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* topo */}
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold tracking-tight text-slate-900">IA Drogarias</div>
          <div className="text-xs text-slate-500">Agendamento de Serviços</div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.3fr_0.7fr]">
        {/* formulário */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-slate-900">Agendar atendimento</h1>
            <p className="mt-1 text-sm text-slate-600">
              Preencha os dados e escolha o melhor horário. Confirmação via WhatsApp.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* nome/whats */}
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

            {/* endereco */}
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

            {/* servico */}
            <div>
              <label className="text-xs font-semibold text-slate-700">Serviço</label>
              <input
                name="servico"
                type="text"
                value={servicoNome}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border bg-slate-100 px-3 py-3 text-sm text-slate-700"
                readOnly
              />

              {!servicoURL ? (
                <div className="mt-1 text-xs text-rose-600">
                  Atenção: nenhum serviço veio na URL. Ex.: <b>?servico=Aplicação%20Injetável</b>
                </div>
              ) : null}

              {servicoNome && !precoLoading && !precoFound ? (
                <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Esse serviço ainda não está no <b>catálogo de preços</b>. Vai aparecer como “Consultar”.
                </div>
              ) : null}
            </div>

            {/* data */}
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

            {/* chips horários */}
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

            {/* obs */}
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

            {/* CTA duplo */}
            <div className="flex flex-col gap-2 sm:flex-row">
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

              <Link
                href={canSolicitarAgora ? `/servicos/solicitar?servico=${servicoEncoded}` : "#"}
                onClick={(e) => {
                  if (!canSolicitarAgora) {
                    e.preventDefault();
                    toast.error("Selecione um serviço para solicitar agora.", {
                      position: "top-center",
                      autoClose: 2500,
                      theme: "colored",
                    });
                  }
                }}
                className="w-full rounded-2xl border px-4 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Solicitar agora
              </Link>
            </div>

            <div className="text-center text-xs text-slate-500">
              IA Drogarias • intermediação entre paciente e profissionais
            </div>
          </form>
        </div>

        {/* resumo */}
        <aside className="lg:sticky lg:top-20">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Resumo do agendamento</div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Serviço</span>
                <span className="font-semibold text-slate-900">{servicoNome || "—"}</span>
              </div>

              {/* ✅ valores */}
              <div className="mt-2 rounded-2xl border bg-slate-50 p-3">
                <div className="mb-2 text-xs font-semibold text-slate-700">Valor estimado</div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Serviço</span>
                    <span className="font-semibold text-slate-900">
                      {precoLoading ? "..." : (precoFound ? brl(preco.preco_servico) : "Consultar")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Locomoção (ida/volta)</span>
                    <span className="font-semibold text-slate-900">
                      {precoLoading ? "..." : (precoFound ? brl(preco.taxa_locomocao) : "Consultar")}
                    </span>
                  </div>

                  <div className="border-t pt-2 flex items-center justify-between">
                    <span className="text-slate-500">Total</span>
                    <span className="text-base font-bold text-slate-900">
                      {precoLoading ? "..." : (precoFound ? brl(total) : "Consultar")}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-500">
                  * Valores do catálogo (se cadastrado). Atendimento “Solicitar agora” usa esses valores.
                </div>
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
                <span className="font-semibold text-slate-900">
                  {onlyDigits(form.telefone) ? onlyDigits(form.telefone) : "—"}
                </span>
              </div>
            </div>

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
