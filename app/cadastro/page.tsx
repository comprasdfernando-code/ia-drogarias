"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, User, Stethoscope, Store, Clock } from "lucide-react";

function cx(...s: Array<string | false | undefined | null>) {
  return s.filter(Boolean).join(" ");
}

const CARDS = [
  {
    title: "Sou Cliente",
    desc: "Crie sua conta para comprar no marketplace e agendar serviços com praticidade.",
    href: "/cadastro/usuarios",
    icon: User,
    tone: "blue" as const,
    chips: ["Marketplace", "Serviços", "Pedidos no painel"],
  },
  {
    title: "Sou Profissional",
    desc: "Cadastre-se para receber agendamentos e oferecer serviços farmacêuticos e bem-estar.",
    href: "/cadastro/profissionais",
    icon: Stethoscope,
    tone: "emerald" as const,
    chips: ["Agenda", "Perfil", "Visibilidade"],
  },
  {
    title: "Sou Drogaria",
    desc: "Seja parceira: venda no marketplace (FV) e receba solicitações de serviços e pedidos.",
    href: "/cadastro/drogarias",
    icon: Store,
    tone: "slate" as const,
    chips: ["FV e-commerce", "Recorrência", "Parceria"],
  },
];

function toneClasses(tone: "blue" | "emerald" | "slate") {
  if (tone === "blue")
    return {
      badge: "bg-blue-700 text-white border-blue-700",
      ring: "ring-1 ring-blue-100",
      iconBg: "bg-blue-50 border",
      icon: "text-blue-700",
      btn: "bg-blue-700 hover:opacity-95 text-white",
      focus: "focus:ring-blue-100",
    };
  if (tone === "emerald")
    return {
      badge: "bg-emerald-600 text-white border-emerald-600",
      ring: "ring-1 ring-emerald-100",
      iconBg: "bg-emerald-50 border",
      icon: "text-emerald-700",
      btn: "bg-emerald-600 hover:opacity-95 text-white",
      focus: "focus:ring-emerald-100",
    };
  return {
    badge: "bg-slate-900 text-white border-slate-900",
    ring: "ring-1 ring-slate-200",
    iconBg: "bg-slate-50 border",
    icon: "text-slate-900",
    btn: "bg-slate-900 hover:opacity-95 text-white",
    focus: "focus:ring-slate-200",
  };
}

export default function CadastroHubPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.16),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_42%),radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.10),transparent_45%)]" />

        <div className="max-w-6xl mx-auto px-6 pt-12 pb-10 relative">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 backdrop-blur px-4 py-2 text-sm text-slate-700 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Cadastros oficiais IA Drogarias
            <span className="mx-1 text-slate-300">•</span>
            <Clock className="w-4 h-4 text-blue-700" />
            Escolha seu perfil
          </div>

          <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Cadastro <span className="text-blue-700">IA Drogarias</span>
          </h1>
          <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed max-w-3xl">
            Selecione o tipo de cadastro para direcionar para a página correta. Assim cada público entra no funil certo
            (cliente, profissional ou drogaria).
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { icon: Sparkles, text: "Marketplace de medicamentos" },
              { icon: ShieldCheck, text: "Agendamentos de serviços" },
              { icon: Clock, text: "Processo rápido" },
            ].map((b, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 border px-3 py-2 text-xs text-slate-700 shadow-sm"
              >
                <b.icon className="w-4 h-4 text-slate-700" />
                {b.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARDS */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CARDS.map((c) => {
            const Icon = c.icon;
            const t = toneClasses(c.tone);

            return (
              <div
                key={c.href}
                className={cx(
                  "rounded-3xl border bg-white shadow-sm hover:shadow-lg transition overflow-hidden",
                  t.ring
                )}
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className={cx("w-12 h-12 rounded-2xl flex items-center justify-center", t.iconBg)}>
                      <Icon className={cx("w-6 h-6", t.icon)} />
                    </div>

                    <span className={cx("text-[11px] font-extrabold px-3 py-1 rounded-full border", t.badge)}>
                      CADASTRO
                    </span>
                  </div>

                  <h2 className="mt-4 text-lg font-extrabold text-slate-900">{c.title}</h2>
                  <p className="mt-2 text-slate-600 text-sm leading-relaxed">{c.desc}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {c.chips.map((chip) => (
                      <span
                        key={chip}
                        className="text-xs text-slate-600 bg-white border rounded-full px-3 py-2"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-6">
                    <Link
                      href={c.href}
                      className={cx(
                        "w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-extrabold shadow-md transition",
                        t.btn
                      )}
                    >
                      Acessar cadastro
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-slate-500 text-sm mt-10">
          💙 IA Drogarias — Saúde com Inteligência
        </p>

        <div className="mt-6 text-center text-xs text-slate-500">
          Já tem conta?{" "}
          <Link href="/login" className="font-extrabold text-blue-700 hover:underline">
            Entrar
          </Link>
        </div>
      </section>

      {/* CTA FIXO */}
      <div className="fixed bottom-4 left-0 right-0 z-50 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border bg-white/85 backdrop-blur shadow-lg p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-extrabold text-slate-900">Escolha o seu perfil</div>
                <div className="text-xs text-slate-600">Cliente • Profissional • Drogaria</div>
              </div>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white px-4 py-3 text-sm font-extrabold hover:opacity-95 transition"
            >
              Já tenho conta
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
