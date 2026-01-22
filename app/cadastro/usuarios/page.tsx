"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Clock,
  Sparkles,
  User,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

// ✅ ajuste para seu caminho real
import { supabase } from "@/lib/supabaseClient";

function cx(...s: Array<string | false | undefined | null>) {
  return s.filter(Boolean).join(" ");
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function CadastroUsuarioPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
  });

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      form.nome.trim().length >= 3 &&
      isValidEmail(form.email.trim()) &&
      form.senha.length >= 6
    );
  }, [form]);

  function handleChange(e: any) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!canSubmit) {
      setErro("Confira os campos: nome (mín. 3), e-mail válido e senha (mín. 6).");
      return;
    }

    setLoading(true);

    try {
      const nome = form.nome.trim();
      const email = form.email.trim();
      const tipo = "cliente";

      // 1) Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.senha,
        options: {
          data: { nome, tipo },
        },
      });

      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) throw new Error("Erro ao criar usuário (sem userId).");

      // 2) Tabela usuarios (opcional, mas recomendado para seu painel)
      const { error: insertError } = await supabase.from("usuarios").insert([
        {
          user_id: userId,
          nome,
          email,
          telefone: null,
          tipo, // cliente
        },
      ]);

      // Se sua tabela tiver RLS/constraints e falhar, você pode optar por não bloquear o cadastro:
      if (insertError) throw insertError;

      setSucesso("✅ Cadastro realizado! Verifique seu e-mail para confirmar.");
      setTimeout(() => router.push("/login"), 2200);
      setForm({ nome: "", email: "", senha: "" });
    } catch (e: any) {
      const msg =
        e?.message?.includes("User already registered") ||
        e?.message?.toLowerCase?.().includes("already")
          ? "❌ Este e-mail já está cadastrado. Faça login."
          : "❌ Erro ao cadastrar. Tente outro e-mail ou tente novamente.";
      setErro(msg);
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
                Cadastro rápido e seguro
                <span className="mx-1 text-slate-300">•</span>
                <Clock className="w-4 h-4 text-blue-700" />
                Em menos de 1 minuto
              </div>

              <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                Crie sua conta na <span className="text-blue-700">IA Drogarias</span>
              </h1>
              <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
                Tenha acesso ao <b>marketplace de medicamentos</b> e aos{" "}
                <b>serviços farmacêuticos</b> com praticidade.
              </p>

              <div className="mt-6 grid sm:grid-cols-3 gap-3">
                {[
                  { icon: Sparkles, t: "Experiência moderna", d: "rápido e fácil" },
                  { icon: ShieldCheck, t: "Dados protegidos", d: "segurança no cadastro" },
                  { icon: Clock, t: "Agilidade", d: "sem burocracia" },
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
                  href="/fv"
                  className="inline-flex items-center gap-2 font-extrabold text-slate-900 hover:text-blue-700 transition"
                >
                  Acessar Farmácia Virtual
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  href="/servicos"
                  className="inline-flex items-center gap-2 font-extrabold text-slate-900 hover:text-emerald-700 transition"
                >
                  Ver Serviços
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Form */}
            <div className="w-full max-w-md">
              <div className="rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-slate-900">Cadastro</h2>
                  <span className="text-xs text-slate-500">Cliente</span>
                </div>

                <form onSubmit={handleCadastro} className="mt-4 space-y-3">
                  <Field
                    label="Nome completo"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="Ex.: Maria da Silva"
                    Icon={User}
                  />
                  <Field
                    label="E-mail"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="voce@dominio.com"
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

                  {erro && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span>{erro}</span>
                    </div>
                  )}

                  {sucesso && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{sucesso}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !canSubmit}
                    className={cx(
                      "w-full rounded-2xl px-4 py-3 font-extrabold text-white shadow-md transition inline-flex items-center justify-center gap-2",
                      loading || !canSubmit
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:opacity-95"
                    )}
                  >
                    {loading ? "Enviando..." : "Cadastrar"}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-xs text-slate-500 text-center pt-1">
                    Você receberá um e-mail para confirmar o cadastro.
                  </p>
                </form>
              </div>

              <p className="text-center text-sm mt-4 text-slate-600">
                Já tem conta?{" "}
                <Link href="/login" className="text-blue-700 font-extrabold hover:underline">
                  Entrar
                </Link>
              </p>
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
          className="w-full rounded-2xl border bg-white px-11 py-3 text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
        />
      </div>
    </label>
  );
}
