"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Catalogo = {
  preco_servico: number;
  taxa_locomocao: number;
};

export default function SolicitarAgoraPage() {
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

  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [sending, setSending] = useState(false);

  const total = useMemo(() => {
    const ps = Number(catalogo?.preco_servico ?? 0);
    const tl = Number(catalogo?.taxa_locomocao ?? 0);
    return ps + tl;
  }, [catalogo]);

  useEffect(() => {
    setForm((p) => ({ ...p, servico: servicoURL }));
  }, [servicoURL]);

  useEffect(() => {
    async function loadPrice() {
      if (!form.servico) {
        setCatalogo(null);
        return;
      }
      setLoadingPrice(true);
      const { data, error } = await supabase
        .from("servicos_catalogo")
        .select("preco_servico,taxa_locomocao")
        .eq("nome", form.servico)
        .eq("ativo", true)
        .maybeSingle();

      if (error) {
        console.error(error);
        setCatalogo(null);
      } else if (data) {
        setCatalogo({
          preco_servico: Number(data.preco_servico ?? 0),
          taxa_locomocao: Number(data.taxa_locomocao ?? 0),
        });
      } else {
        setCatalogo(null);
      }
      setLoadingPrice(false);
    }
    loadPrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.servico]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  function validate() {
    if (!form.servico.trim()) return "Serviço inválido.";
    if (!form.nome.trim()) return "Informe seu nome.";
    if (onlyDigits(form.whatsapp).length < 10) return "WhatsApp inválido (DDD + número).";
    if (!form.endereco.trim()) return "Informe o endereço.";
    return "";
  }

  async function criarChamado(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err, { position: "top-center", autoClose: 3000, theme: "colored" });
      return;
    }

    const ps = Number(catalogo?.preco_servico ?? 0);
    const tl = Number(catalogo?.taxa_locomocao ?? 0);

    setSending(true);
    const { data, error } = await supabase
      .from("chamados")
      .insert({
        status: "procurando",
        servico: form.servico,
        cliente_nome: form.nome.trim(),
        cliente_whatsapp: onlyDigits(form.whatsapp),
        endereco: form.endereco.trim(),
        observacoes: form.observacoes?.trim() || null,
        preco_servico: ps,
        taxa_locomocao: tl,
        // total é calculado pelo trigger
      })
      .select("id")
      .single();

    setSending(false);

    if (error || !data?.id) {
      console.error(error);
      toast.error("❌ Não foi possível criar o chamado. Tente novamente.", {
        position: "top-center",
        autoClose: 3500,
        theme: "colored",
      });
      return;
    }

    router.push(`/servicos/chamado/${data.id}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">IA Drogarias</div>
          <div className="text-xs text-slate-500">Solicitar agora</div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Chamar profissional agora</h1>
          <p className="mt-1 text-sm text-slate-600">
            Vamos procurar um profissional disponível. Assim que alguém aceitar, você verá na tela.
          </p>

          <form onSubmit={criarChamado} className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Serviço</label>
              <input
                name="servico"
                value={form.servico}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border bg-slate-100 px-3 py-3 text-sm"
                readOnly={!!servicoURL}
              />
              {!form.servico ? (
                <div className="mt-1 text-xs text-rose-600">
                  Use a URL com <b>?servico=...</b>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Seu nome</label>
                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">WhatsApp</label>
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Endereço</label>
              <input
                name="endereco"
                value={form.endereco}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
                placeholder="Rua, número, bairro, complemento"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Observações (opcional)</label>
              <textarea
                name="observacoes"
                value={form.observacoes}
                onChange={handleChange}
                className="mt-1 min-h-[90px] w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
                placeholder="Ponto de referência, preferência de horário, etc."
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
              {sending ? "Criando chamado..." : "Procurar profissional disponível"}
            </button>
          </form>
        </div>

        <aside className="lg:sticky lg:top-20">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Valores</div>

            {loadingPrice ? (
              <div className="mt-3 text-sm text-slate-500">Carregando valores...</div>
            ) : !catalogo ? (
              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
                Sem preço cadastrado para esse serviço no <b>servicos_catalogo</b>.
                <div className="mt-1 text-xs text-amber-700">
                  Você pode cadastrar e recarregar a página.
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Serviço</span>
                  <span className="font-semibold text-slate-900">{formatBRL(Number(catalogo.preco_servico))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Locomoção (ida/volta)</span>
                  <span className="font-semibold text-slate-900">{formatBRL(Number(catalogo.taxa_locomocao))}</span>
                </div>
                <div className="mt-2 border-t pt-2 flex items-center justify-between">
                  <span className="text-slate-500">Total</span>
                  <span className="text-base font-bold text-slate-900">{formatBRL(total)}</span>
                </div>
              </div>
            )}

            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
              Ao criar o chamado, você será direcionado para a tela de busca em tempo real.
            </div>
          </div>
        </aside>
      </div>

      <ToastContainer />
    </main>
  );
}
