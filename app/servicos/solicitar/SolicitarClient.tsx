"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}
function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Preco = { preco_servico: number; taxa_locomocao: number };

export default function SolicitarClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const servicoURL = sp.get("servico") || "";

  const [form, setForm] = useState({
    servico: servicoURL,
    nome: "",
    whatsapp: "",
    endereco: "",
    observacoes: "",
  });

  const [loadingPreco, setLoadingPreco] = useState(false);
  const [preco, setPreco] = useState<Preco>({ preco_servico: 0, taxa_locomocao: 0 });

  const total = useMemo(
    () => (Number(preco.preco_servico || 0) + Number(preco.taxa_locomocao || 0)),
    [preco]
  );

  useEffect(() => {
    if (servicoURL) setForm((p) => ({ ...p, servico: servicoURL }));
  }, [servicoURL]);

  // ====== PREÇO (robusto)
  async function carregarPreco(nomeServico: string) {
    const q = (nomeServico || "").trim();
    if (!q) {
      setPreco({ preco_servico: 0, taxa_locomocao: 0 });
      return;
    }

    setLoadingPreco(true);

    // 1) tenta EXATO com ativo=true
    let data: any = null;
    let error: any = null;

    const r1 = await supabase
      .from("servicos_catalogo")
      .select("preco_servico,taxa_locomocao,nome,ativo")
      .eq("nome", q)
      .eq("ativo", true)
      .maybeSingle();

    data = r1.data;
    error = r1.error;

    // se sua tabela não tiver coluna ativo, cai aqui
    if (error?.code === "42703" && String(error?.message || "").includes("ativo")) {
      const rNoAtivo = await supabase
        .from("servicos_catalogo")
        .select("preco_servico,taxa_locomocao,nome")
        .eq("nome", q)
        .maybeSingle();
      data = rNoAtivo.data;
      error = rNoAtivo.error;
    }

    // 2) se não achou, tenta ILIKE (nome parecido)
    if (!data && !error) {
      const r2 = await supabase
        .from("servicos_catalogo")
        .select("preco_servico,taxa_locomocao,nome,ativo")
        .ilike("nome", q)
        .eq("ativo", true)
        .maybeSingle();

      data = r2.data;
      error = r2.error;

      if (error?.code === "42703" && String(error?.message || "").includes("ativo")) {
        const r2b = await supabase
          .from("servicos_catalogo")
          .select("preco_servico,taxa_locomocao,nome")
          .ilike("nome", q)
          .maybeSingle();
        data = r2b.data;
        error = r2b.error;
      }
    }

    // 3) fallback final: zerado
    setPreco({
      preco_servico: Number(data?.preco_servico ?? 0),
      taxa_locomocao: Number(data?.taxa_locomocao ?? 0),
    });

    setLoadingPreco(false);
  }

  useEffect(() => {
    carregarPreco(form.servico);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.servico]);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  function validate() {
    if (!form.servico.trim()) return "Informe o serviço.";
    if (!form.nome.trim()) return "Informe seu nome.";
    if (onlyDigits(form.whatsapp).length < 10) return "WhatsApp inválido (DDD + número).";
    if (!form.endereco.trim()) return "Informe o endereço para o atendimento.";
    return "";
  }

  const [sending, setSending] = useState(false);

  async function criarChamado() {
    const err = validate();
    if (err) return alert(err);
    if (sending) return;

    setSending(true);

    // cliente pode estar logado ou não (mas INSERT permite anon também)
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id || null;

    const payload = {
      status: "procurando",
      servico: form.servico.trim(),
      cliente_nome: form.nome.trim(),
      cliente_whatsapp: onlyDigits(form.whatsapp),
      endereco: form.endereco.trim(),
      observacoes: form.observacoes.trim() || null,
      preco_servico: Number(preco.preco_servico ?? 0),
      taxa_locomocao: Number(preco.taxa_locomocao ?? 0),
      total: Number(total ?? 0),

      // IMPORTANTÍSSIMO: deixar profissional_* nulo (policy exige isso no INSERT)
      profissional_id: null,
      profissional_nome: null,
      profissional_uid: null,

      // policy do SELECT/INSERT usa isso
      is_public: true,

      // opcional (se você criar coluna depois)
      // cliente_uid: uid,
    };

    const { data, error } = await supabase.from("chamados").insert(payload).select("id").single();

    setSending(false);

    if (error || !data?.id) {
      console.error("Erro ao criar chamado:", { error, payload });
      alert(`Não foi possível criar o chamado.\n${error?.code || ""} ${error?.message || ""}`.trim());
      return;
    }

    router.push(`/servicos/chamado/${data.id}`);
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Atendimento imediato</h1>
        <p className="mt-1 text-sm text-slate-600">
          Você solicita agora e um profissional disponível aceita. A confirmação aparece em tempo real.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">Serviço</label>
            <input
              name="servico"
              value={form.servico}
              onChange={onChange}
              placeholder="Ex.: Aferição de Pressão Arterial"
              className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">Seu nome</label>
              <input
                name="nome"
                value={form.nome}
                onChange={onChange}
                className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">WhatsApp</label>
              <input
                name="whatsapp"
                value={form.whatsapp}
                onChange={onChange}
                className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Endereço</label>
            <input
              name="endereco"
              value={form.endereco}
              onChange={onChange}
              className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
              placeholder="Rua, número, bairro, complemento"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Observações (opcional)</label>
            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={onChange}
              className="mt-1 min-h-[90px] w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
              placeholder="Ex.: ponto de referência, preferência..."
            />
          </div>

          <button
            onClick={criarChamado}
            disabled={sending}
            className={[
              "w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition",
              sending ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:opacity-95",
            ].join(" ")}
          >
            {sending ? "Criando chamado..." : "Solicitar agora"}
          </button>

          <div className="text-center text-xs text-slate-400">
            IA Drogarias • intermediação entre paciente e profissionais
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Resumo do valor</div>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Serviço</span>
              <span className="font-semibold text-slate-900">
                {loadingPreco ? "..." : brl(preco.preco_servico)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Locomoção (ida e volta)</span>
              <span className="font-semibold text-slate-900">
                {loadingPreco ? "..." : brl(preco.taxa_locomocao)}
              </span>
            </div>
            <div className="mt-2 border-t pt-2 flex items-center justify-between">
              <span className="text-slate-500">Total</span>
              <span className="text-base font-bold text-slate-900">
                {loadingPreco ? "..." : brl(total)}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            O valor aparece antes do aceite. O profissional aceita sabendo quanto vai receber.
          </div>
        </div>
      </aside>
    </div>
  );
}
