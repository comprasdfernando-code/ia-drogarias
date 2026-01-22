"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  Clock,
  Mail,
  User,
  Lock,
  Phone,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

// ✅ ajuste este import para o seu caminho real
import { supabase } from "@/lib/supabaseClient";

function cx(...s: Array<string | false | undefined | null>) {
  return s.filter(Boolean).join(" ");
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function formatWhats(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function CadastroProfissionaisPage() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
  });

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const tel = onlyDigits(form.telefone);
    return (
      form.nome.trim().length >= 3 &&
      isValidEmail(form.email) &&
      form.senha.length >= 6 &&
      tel.length >= 10
    );
  }, [form]);

  function handleChange(e: any) {
    const { name, value } = e.target;

    if (name === "telefone") {
      setForm((p) => ({ ...p, telefone: formatWhats(value) }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!canSubmit) {
      setErr("Confira os campos: nome, e-mail válido, senha (mín. 6) e WhatsApp.");
      return;
    }

    setLoading(true);

    try {
      // 1) Auth
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.senha,
        options: {
          data: {
            nome: form.nome.trim(),
            telefone: onlyDigits(form.telefone),
          },
        },
      });

      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) throw new Error("Erro ao criar usuário (sem userId).");

      // 2) Tabela usuarios
      const { error: insertError } = await supabase.from("usuarios").insert([
        {
          user_id: userId,
          nome: form.nome.trim(),
          email: form.email.trim(),
          telefone: onlyDigits(form.telefone),
          tipo: "farmaceutico",
        },
      ]);

      if (insertError) throw insertError;

      setOk("✅ Cadastro concluído! Verifique seu e-mail para confirmar o acesso.");
      setForm({ nome: "", email: "", senha: "", telefone: "" });
    } catch (e: any) {
      setErr(e?.message || "Erro ao cadastrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.16),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_42%),radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.10),transparent_45%)]" />
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-10 relative">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Left */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 backdrop-blur px-4 py-2 text-sm text-slate-700 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Plataforma para profissionais
                <span className="mx-1 text-slate-300">•</span>
                <Clock className="w-4 h-4 text-blue-700" />
                Agendamentos + visibilidade
              </div>

              <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                Cadastro de <span className="text-blue-700">Profissionais</span>
              </h1>
              <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
                Faça parte da IA Drogarias e receba pacientes para serviços farmacêuticos,
                bem-estar e estética — com agenda organizada e presença digital.
              </p>

              <div className="mt-6 grid sm:grid-cols-3 gap-3">
                {[
                  { icon: Sparkles, t: "Perfil profissional", d: "destaque e confiança" },
                  { icon: Clock, t: "Agenda eficiente", d: "menos furos e retrabalho" },
                  { icon: ShieldCheck, t: "Atendimento seguro", d: "orientado e claro" },
                ].map((b, i) => (
                  <div key={i} className="rounded-2xl border bg-white/70 backdrop-blur p-4 shadow-sm">
                    <b.icon className="w-5 h-5 text-slate-900" />
                    <div className="mt-2 font-extrabold text-slate-900 text-sm">{b.t}</div>
                    <div className="text-slate-600 text-xs">{b.d}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3 text-sm">
                <Link
                  href="/servicos"
                  className="inline-flex items-center gap-2 font-extrabold text-slate-900 hover:text-blue-700 transition"
                >
                  Ver serviços
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">IA Drogarias — Saúde com Inteligência</span>
              </div>
            </div>

            {/* Form card */}
            <div className="w-full max-w-md">
              <div className="rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-slate-900">Crie seu acesso</h2>
                  <span className="text-xs text-slate-500">Grátis</span>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                  <Field
                    label="Nome completo"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="Ex.: Fernando Pereira"
                    Icon={User}
                  />

                  <Field
                    label="E-mail"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="ex.: voce@dominio.com"
                    Icon={Mail}
                  />

                  <Field
                    label="Senha"
                    name="senha"
                    type="password"
                    value={form.senha}
                    onChange={handleChange}
                    placeholder="mínimo 6 caracteres"
                    Icon={Lock}
                  />

                  <Field
                    label="Telefone / WhatsApp"
                    name="telefone"
                    value={form.telefone}
                    onChange={handleChange}
                    placeholder="(11) 90000-0000"
                    Icon={Phone}
                  />

                  {err && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {err}
                    </div>
                  )}
                  {ok && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{ok}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !canSubmit}
                    className={cx(
                      "w-full rounded-2xl px-4 py-3 font-extrabold text-white shadow-md transition inline-flex items-center justify-center gap-2",
                      loading || !canSubmit
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-blue-700 hover:opacity-95"
                    )}
                  >
                    {loading ? "Enviando..." : "Cadastrar agora"}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-xs text-slate-500 text-center pt-1">
                    Ao cadastrar, você concorda em fornecer dados corretos para contato e atendimento.
                  </p>
                </form>
              </div>

              <div className="mt-4 text-center text-xs text-slate-500">
                Já tem cadastro?{" "}
                <Link className="font-bold text-blue-700 hover:underline" href="/login">
                  Entrar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  Icon,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: any) => void;
  placeholder?: string;
  type?: string;
  Icon: any;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <div className="mt-1 relative">
        <Icon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="w-full rounded-2xl border bg-white px-11 py-3 text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </label>
  );
}
