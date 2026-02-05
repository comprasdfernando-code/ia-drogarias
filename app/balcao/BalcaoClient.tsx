"use client";

import React, { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

const WHATS_CENTRAL = "5511952068432"; // 11 95206-8432

function wpp(text: string) {
  return `https://wa.me/${WHATS_CENTRAL}?text=${encodeURIComponent(text)}`;
}

const MOTIVOS = [
  "Dúvida sobre medicamento",
  "Como tomar / posologia",
  "Interação medicamentosa",
  "Efeito colateral",
  "Troca por genérico / similar",
  "Acompanhamento (pressão / glicemia)",
  "Orientação uso contínuo",
  "Outros",
];

export default function BalcaoClient() {
  const [form, setForm] = useState({
    nome: "",
    whatsapp: "",
    motivo: MOTIVOS[0],
    mensagem: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [sending, setSending] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      form.nome.trim().length >= 2 &&
      onlyDigits(form.whatsapp).length >= 10 &&
      form.mensagem.trim().length >= 5
    );
  }, [form]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onPickFile = (f: File | null) => {
    setFile(f);
    if (!f) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const uploadAnexo = async (f: File) => {
    // limite simples (ajuste se quiser)
    const maxMB = 8;
    if (f.size > maxMB * 1024 * 1024) {
      throw new Error(`Arquivo muito grande (máx ${maxMB}MB).`);
    }

    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext) ? ext : "jpg";
    const path = `balcao/${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`;

    const { error } = await supabase.storage.from("balcao").upload(path, f, {
      cacheControl: "3600",
      upsert: false,
      contentType: f.type || undefined,
    });

    if (error) throw error;

    // bucket público: gera url pública
    const { data } = supabase.storage.from("balcao").getPublicUrl(path);
    return { url: data.publicUrl, path };
  };

  const submit = async () => {
    if (!canSubmit) {
      toast.error("Preencha nome, WhatsApp e a mensagem.", { position: "top-center", autoClose: 2500, theme: "colored" });
      return;
    }

    setSending(true);

    try {
      let anexo_url: string | null = null;
      let anexo_path: string | null = null;

      if (file) {
        const up = await uploadAnexo(file);
        anexo_url = up.url;
        anexo_path = up.path;
      }

      const payload = {
        cliente_nome: form.nome.trim(),
        cliente_whatsapp: onlyDigits(form.whatsapp),
        motivo: form.motivo,
        mensagem: form.mensagem.trim(),
        anexo_url,
        anexo_path,
      };

      const res = await fetch("/api/balcao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Erro ao registrar atendimento.");

      const protocolo = json?.protocolo || "BV";
      const anexoTxt = anexo_url ? `\n📎 Anexo: ${anexo_url}` : "";

      const msg = `Olá! Quero atendimento no *Balcão Virtual IA Drogarias*.
🧾 Protocolo: *${protocolo}*
👤 Nome: ${payload.cliente_nome}
📱 WhatsApp: ${payload.cliente_whatsapp}
🧩 Motivo: ${payload.motivo}
📝 Mensagem: ${payload.mensagem}${anexoTxt}

Por favor, podem me atender?`;

      toast.success("Registrado! Abrindo WhatsApp…", { position: "top-center", autoClose: 1200, theme: "colored" });

      // abre WhatsApp
      window.location.href = wpp(msg);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Falha ao enviar. Tente novamente.", { position: "top-center", autoClose: 3500, theme: "colored" });
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold tracking-tight text-slate-900">IA Drogarias</div>
          <div className="text-xs text-slate-500">Balcão Virtual</div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Balcão Virtual</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tire dúvidas com a central farmacêutica. Você pode anexar foto da receita ou do medicamento.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">Seu nome</label>
              <input
                name="nome"
                value={form.nome}
                onChange={onChange}
                placeholder="Nome completo"
                className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">WhatsApp</label>
              <input
                name="whatsapp"
                value={form.whatsapp}
                onChange={onChange}
                placeholder="(11) 99999-9999"
                className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
              />
              <div className="mt-1 text-xs text-slate-500">Digite com DDD.</div>
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs font-semibold text-slate-700">Motivo do atendimento</label>
            <select
              name="motivo"
              value={form.motivo}
              onChange={onChange}
              className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
            >
              {MOTIVOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            <label className="text-xs font-semibold text-slate-700">Explique sua dúvida</label>
            <textarea
              name="mensagem"
              value={form.mensagem}
              onChange={onChange}
              placeholder="Conte o que está acontecendo, quais medicamentos usa, etc."
              className="mt-1 min-h-[120px] w-full rounded-2xl border px-3 py-3 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div className="mt-3">
            <label className="text-xs font-semibold text-slate-700">Anexo (foto/receita/caixa) — opcional</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => onPickFile(e.target.files?.[0] || null)}
              className="mt-1 w-full rounded-2xl border bg-white px-3 py-3 text-sm"
            />

            {preview ? (
              <div className="mt-3 rounded-2xl border bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-700">Prévia</div>
                {/* se for pdf não dá pra pré-visualizar simples, mas ok */}
                {file?.type?.includes("pdf") ? (
                  <div className="mt-2 text-xs text-slate-600">PDF selecionado: {file?.name}</div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Prévia do anexo" className="mt-2 w-full rounded-xl border object-contain" />
                )}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            disabled={sending}
            onClick={submit}
            className={[
              "mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition",
              sending ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:opacity-95",
            ].join(" ")}
          >
            {sending ? "Enviando…" : "Chamar no WhatsApp agora"}
          </button>

          <div className="mt-3 text-center text-[11px] text-slate-500">
            IA Drogarias • Atendimento via WhatsApp • Protocolo automático
          </div>
        </div>
      </div>

      <ToastContainer />
    </main>
  );
}
