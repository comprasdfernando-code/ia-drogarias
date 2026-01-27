"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}
function brl(v: number) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function normalizeServicoParam(s: string) {
  // suporta ?servico=Teste%20de%20Glicemia e ?servico=Teste+de+Glicemia
  try {
    return decodeURIComponent(s || "").replace(/\+/g, " ").trim();
  } catch {
    return (s || "").replace(/\+/g, " ").trim();
  }
}

export default function SolicitarClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // ✅ NORMALIZA o serviço vindo da URL
  const servicoURL = useMemo(() => normalizeServicoParam(sp.get("servico") || ""), [sp]);

  const [form, setForm] = useState({
    servico: servicoURL,
    nome: "",
    whatsapp: "",
    endereco: "",
    observacoes: "",
  });

  const [loadingPreco, setLoadingPreco] = useState(false);
  const [preco, setPreco] = useState({ preco_servico: 0, taxa_locomocao: 0 });

  const total = useMemo(
    () => (Number(preco.preco_servico) || 0) + (Number(preco.taxa_locomocao) || 0),
    [preco]
  );

  // mantém o campo servico sincronizado com URL
  useEffect(() => {
    if (servicoURL) {
      setForm((p) => ({ ...p, servico: servicoURL }));
    }
  }, [servicoURL]);

  async function carregarPreco(nomeServico: string) {
    const nome = (nomeServico || "").trim();
    if (!nome) {
      setPreco({ preco_servico: 0, taxa_locomocao: 0 });
      return;
    }

    setLoadingPreco(true);

    // 1) tenta match exato
    let res = await supabase
      .from("servicos_catalogo")
      .select("preco_servico,taxa_locomocao")
      .eq("nome", nome)
      .eq("ativo", true)
      .maybeSingle();

    // 2) fallback: ilike (tolerante a variações)
    if (!res.data) {
      res = await supabase
        .from("servicos_catalogo")
        .select("preco_servico,taxa_locomocao,nome")
        .ilike("nome", `%${nome}%`)
        .eq("ativo", true)
        .order("preco_servico", { ascending: false })
        .limit(1)
        .maybeSingle();
    }

    setPreco({
      preco_servico: Number(res.data?.preco_servico ?? 0),
      taxa_locomocao: Number(res.data?.taxa_locomocao ?? 0),
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
    const msg = validate();
    if (msg) return alert(msg);
    if (sending) return;

    setSending(true);

    // ✅ GARANTE serviço normalizado mesmo se usuário editar
    const servicoFinal = normalizeServicoParam(form.servico);

    const payload = {
      status: "procurando",
      servico: servicoFinal,
      cliente_nome: form.nome.trim(),
      cliente_whatsapp: onlyDigits(form.whatsapp),
      endereco: form.endereco.trim(),
      observacoes: form.observacoes.trim() || null,
      preco_servico: Number(preco.preco_servico ?? 0),
      taxa_locomocao: Number(preco.taxa_locomocao ?? 0),
      total: Number(total ?? 0),
      // NÃO envie profissional_* aqui (tem policy pra exigir null)
    };

    const { data, error } = await supabase
      .from("chamados")
      .insert(payload)
      .select("id")
      .single();

    setSending(false);

    if (error || !data?.id) {
      // ✅ log completo pra enxergar RLS / permissões / validação
      console.error("Erro ao criar chamado:", { error, payload });
      alert(`Não foi possível criar o chamado.\n${error?.code || ""} ${error?.message || ""}`);
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
