"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Clock,
  HeartPulse,
  Syringe,
  ScanLine,
  Stethoscope,
  Pill,
  Leaf,
  Sparkles,
  Droplets,
  Waves,
  Dna,
  ChevronDown,
  Search,
  ArrowRight,
  PhoneCall,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

type Categoria =
  | "Clínicos"
  | "Atenção Farmacêutica"
  | "Imunização"
  | "Bem-estar"
  | "Estética";

type Servico = {
  id: string;
  nome: string;
  slug: string;
  desc: string;
  categoria: Categoria;
  duracao: string;
  preco?: string; // total exibido
  destaque?: boolean;
  icon: React.ElementType;
  tags?: string[];
};

const WHATSAPP = "5511948343725"; // ajuste se quiser
const BRAND = "IA Drogarias — Saúde com Inteligência";

const CATEGORIAS: { key: Categoria | "Todos"; label: string; icon: React.ElementType }[] = [
  { key: "Todos", label: "Todos", icon: ShieldCheck },
  { key: "Clínicos", label: "Clínicos", icon: HeartPulse },
  { key: "Atenção Farmacêutica", label: "Atenção Farmacêutica", icon: Pill },
  { key: "Imunização", label: "Imunização", icon: Syringe },
  { key: "Bem-estar", label: "Bem-estar", icon: Leaf },
  { key: "Estética", label: "Estética", icon: Sparkles },
];

function cx(...s: Array<string | false | undefined | null>) {
  return s.filter(Boolean).join(" ");
}

function AgendaLink({ nome }: { nome: string }) {
  return `/servicos/agenda?servico=${encodeURIComponent(nome)}`;
}

function brl(v: number) {
  return (Number(v || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function guessCategoria(nome: string): Categoria {
  const n = (nome || "").toLowerCase();

  if (n.includes("vacina") || n.includes("imun")) return "Imunização";

  if (
    n.includes("limpeza") ||
    n.includes("peeling") ||
    n.includes("microagul") ||
    n.includes("enzima") ||
    n.includes("estét")
  ) return "Estética";

  if (n.includes("consulta") || n.includes("revis") || n.includes("medicament"))
    return "Atenção Farmacêutica";

  if (n.includes("fitoter") || n.includes("orelha") || n.includes("lóbulo") || n.includes("lobulo"))
    return "Bem-estar";

  return "Clínicos";
}

function guessDuracao(nome: string): string {
  const n = (nome || "").toLowerCase();

  if (n.includes("pressão") || n.includes("glic")) return "10–15 min";
  if (n.includes("vacina") || n.includes("inje")) return "20–30 min";
  if (n.includes("consulta")) return "30–60 min";
  if (n.includes("revis")) return "30–45 min";

  if (n.includes("limpeza")) return "45–60 min";
  if (n.includes("peeling")) return "30–45 min";
  if (n.includes("microagul")) return "45–60 min";
  if (n.includes("enzima")) return "30–45 min";

  if (n.includes("fitoter")) return "20–30 min";
  if (n.includes("orelha") || n.includes("lóbulo") || n.includes("lobulo")) return "10–20 min";

  return "—";
}

function guessIcon(nome: string) {
  const n = (nome || "").toLowerCase();
  if (n.includes("pressão")) return HeartPulse;
  if (n.includes("glic")) return ScanLine;
  if (n.includes("vacina")) return Syringe;
  if (n.includes("inje")) return Syringe;
  if (n.includes("consulta")) return Stethoscope;
  if (n.includes("revis") || n.includes("medicament")) return Pill;
  if (n.includes("fitoter")) return Leaf;
  if (n.includes("limpeza")) return Droplets;
  if (n.includes("peeling")) return Sparkles;
  if (n.includes("microagul")) return Dna;
  if (n.includes("enzima")) return Waves;
  return ShieldCheck;
}

export default function ServicosPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Categoria | "Todos">("Todos");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [loading, setLoading] = useState(true);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErro(null);

      const { data, error } = await supabase
        .from("servicos_catalogo")
        .select("id, nome, descricao, preco_servico, taxa_locomocao, ativo")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (!alive) return;

      if (error) {
        setErro(error.message);
        setServicos([]);
        setLoading(false);
        return;
      }

      const mapped: Servico[] = (data || []).map((r: any) => {
        const nome = String(r.nome || "");
        const precoServico = Number(r.preco_servico || 0);
        const taxa = Number(r.taxa_locomocao || 0);
        const total = precoServico + taxa;

        const categoria = guessCategoria(nome);

        return {
          id: String(r.id),
          nome,
          slug: slugify(nome),
          desc:
            (r.descricao && String(r.descricao).trim()) ||
            "Atendimento com orientação profissional e registro quando aplicável.",
          categoria,
          duracao: guessDuracao(nome),
          preco: brl(total),
          destaque: false,
          icon: guessIcon(nome),
          tags: [],
        };
      });

      // ✅ Destaques automáticos: pega 4 mais “fortes” por categoria/uso
      // (se depois você criar coluna destaque no banco, eu ajusto pra respeitar)
      const autoFeaturedNames = new Set([
        "Aferição de Pressão Arterial",
        "Medição de Glicemia",
        "Revisão de Medicamentos",
        "Consulta Farmacêutica",
      ]);
      const final = mapped.map((s) => ({ ...s, destaque: autoFeaturedNames.has(s.nome) }));

      setServicos(final);
      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const filtrados = useMemo(() => {
    const query = q.trim().toLowerCase();
    return servicos.filter((s) => {
      const matchCat = cat === "Todos" ? true : s.categoria === cat;
      const matchFeatured = onlyFeatured ? !!s.destaque : true;
      const haystack = `${s.nome} ${s.desc} ${s.categoria} ${(s.tags || []).join(" ")}`.toLowerCase();
      const matchQ = query ? haystack.includes(query) : true;
      return matchCat && matchFeatured && matchQ;
    });
  }, [q, cat, onlyFeatured, servicos]);

  const destaques = useMemo(() => servicos.filter((s) => s.destaque).slice(0, 4), [servicos]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.15),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_42%),radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.10),transparent_45%)]" />
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 backdrop-blur px-4 py-2 text-sm text-slate-700 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                Atendimento com orientação profissional
                <span className="mx-1 text-slate-300">•</span>
                <Clock className="w-4 h-4 text-emerald-600" />
                Agendamento rápido
              </div>

              <a
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-sm shadow hover:opacity-95 transition"
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                  "Olá! Quero agendar um serviço farmacêutico/estético."
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <PhoneCall className="w-4 h-4" />
                WhatsApp direto
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                  Serviços que passam{" "}
                  <span className="text-blue-700">confiança</span> e{" "}
                  <span className="text-emerald-600">resultado</span>.
                </h1>
                <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                  Do check-up rápido à atenção farmacêutica completa — com organização, acolhimento
                  e uma experiência de agendamento simples.
                </p>

                <div className="mt-3 text-sm text-slate-500">
                  {loading
                    ? "Carregando catálogo…"
                    : erro
                    ? `Erro ao carregar catálogo: ${erro}`
                    : `Catálogo carregado: ${servicos.length} serviço(s).`}
                </div>

                {/* Busca */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Buscar: pressão, glicemia, limpeza de pele..."
                      className="w-full rounded-2xl border bg-white/80 backdrop-blur px-11 py-3 text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setOnlyFeatured((v) => !v)}
                    className={cx(
                      "rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm transition",
                      onlyFeatured
                        ? "bg-blue-700 text-white border-blue-700"
                        : "bg-white/80 text-slate-700 hover:bg-white"
                    )}
                  >
                    {onlyFeatured ? "Mostrando destaques" : "Ver só destaques"}
                  </button>
                </div>

                {/* Badges */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    { icon: ShieldCheck, text: "Segurança e orientação" },
                    { icon: Clock, text: "Tempo médio informado" },
                    { icon: Sparkles, text: "Experiência premium" },
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

              {/* Card destaque */}
              <div className="lg:col-span-5">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.05 }}
                  className="rounded-3xl border bg-white/80 backdrop-blur shadow-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-slate-900">Destaques de hoje</h2>
                    <div className="text-xs text-slate-500">Agende em segundos</div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {(destaques.length ? destaques : filtrados.slice(0, 4)).map((s) => {
                      const Icon = s.icon;
                      return (
                        <Link
                          key={s.id}
                          href={AgendaLink({ nome: s.nome })}
                          className="group rounded-2xl border bg-white hover:bg-slate-50 transition p-4 flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center border">
                            <Icon className="w-5 h-5 text-blue-700" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900">{s.nome}</div>
                            <div className="text-xs text-slate-500">
                              {s.duracao} • {s.categoria} • <span className="font-bold">{s.preco}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
                        </Link>
                      );
                    })}
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    Dica: clique no serviço para ir direto ao agendamento.
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="max-w-6xl mx-auto px-6 pb-6">
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => {
            const Icon = c.icon;
            const active = cat === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setCat(c.key as any)}
                className={cx(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition",
                  active
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <Icon className={cx("w-4 h-4", active ? "text-white" : "text-slate-700")} />
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* GRID DE SERVIÇOS */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Escolha seu serviço</h2>
            <p className="text-slate-600 mt-1">
              {loading ? "Carregando…" : `${filtrados.length} serviço(s) encontrado(s) • clique para agendar`}
            </p>
          </div>

          <div className="text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Atendimento responsável e orientado
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtrados.map((s) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25 }}
                  className={cx(
                    "rounded-3xl border bg-white shadow-sm hover:shadow-lg transition overflow-hidden",
                    s.destaque && "ring-1 ring-blue-100"
                  )}
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-700" />
                      </div>

                      <div className="flex items-center gap-2">
                        {s.destaque && (
                          <span className="text-[11px] font-extrabold bg-blue-700 text-white px-3 py-1 rounded-full">
                            DESTAQUE
                          </span>
                        )}
                        <span className="text-[11px] font-bold bg-slate-900 text-white px-3 py-1 rounded-full">
                          {s.categoria}
                        </span>
                      </div>
                    </div>

                    <h3 className="mt-4 text-lg font-extrabold text-slate-900 leading-snug">
                      {s.nome}
                    </h3>
                    <p className="mt-2 text-slate-600 text-sm leading-relaxed">{s.desc}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 text-xs text-slate-700 bg-slate-50 border rounded-full px-3 py-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        {s.duracao}
                      </span>

                      <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 bg-white border rounded-full px-3 py-2">
                        Total: {s.preco || "—"}
                      </span>
                    </div>

                    <div className="mt-auto pt-5 grid grid-cols-2 gap-3">
                      <Link
                        href={AgendaLink({ nome: s.nome })}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 text-white px-4 py-3 font-extrabold text-sm hover:opacity-95 transition"
                      >
                        Agendar
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <a
                        href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                          `Olá! Quero agendar: ${s.nome}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border bg-white px-4 py-3 font-extrabold text-sm text-slate-900 hover:bg-slate-50 transition"
                      >
                        WhatsApp
                        <PhoneCall className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {!loading && filtrados.length === 0 && (
          <div className="mt-10 rounded-3xl border bg-white p-8 text-center shadow-sm">
            <div className="text-lg font-extrabold text-slate-900">Nada por aqui 😅</div>
            <div className="text-slate-600 mt-1">
              Tente buscar por “glicemia”, “pressão” ou limpe os filtros.
            </div>
            <div className="mt-4 flex gap-2 justify-center">
              <button
                className="rounded-2xl bg-slate-900 text-white px-4 py-3 text-sm font-extrabold"
                onClick={() => {
                  setQ("");
                  setCat("Todos");
                  setOnlyFeatured(false);
                }}
              >
                Limpar filtros
              </button>
            </div>
          </div>
        )}
      </section>

      {/* PROVA SOCIAL / CONFIANÇA */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {[
            {
              icon: ShieldCheck,
              title: "Segurança em primeiro lugar",
              text: "Atendimento orientado, com foco em cuidado e responsabilidade.",
            },
            {
              icon: Clock,
              title: "Rápido e organizado",
              text: "Tempo médio de serviço informado pra você se programar.",
            },
            {
              icon: HeartPulse,
              title: "Acompanhamento que faz sentido",
              text: "Registro e orientação para você evoluir no cuidado com a saúde.",
            },
          ].map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border flex items-center justify-center">
                  <Icon className="w-6 h-6 text-emerald-700" />
                </div>
                <div className="mt-4 text-lg font-extrabold text-slate-900">{b.title}</div>
                <div className="mt-2 text-slate-600 text-sm leading-relaxed">{b.text}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 border-b">
            <h2 className="text-2xl font-extrabold text-slate-900">Perguntas frequentes</h2>
            <p className="text-slate-600 mt-2">
              Tudo para deixar o cliente seguro antes de agendar.
            </p>
          </div>

          <div className="p-4 sm:p-6">
            {[
              {
                q: "Como funciona o agendamento?",
                a: "Você escolhe o serviço e segue para a página de agenda já com o serviço selecionado. Se preferir, pode chamar no WhatsApp.",
              },
              {
                q: "Precisa levar alguma coisa?",
                a: "Quando fizer sentido, leve lista de medicamentos, exames recentes e suas dúvidas. Isso ajuda muito na orientação.",
              },
              {
                q: "Quanto tempo demora?",
                a: "Cada serviço mostra um tempo médio. Em geral, serviços rápidos levam 10–15 min e consultas/revisões podem levar 30–60 min.",
              },
              {
                q: "Posso agendar mais de um serviço?",
                a: "Sim. Você pode agendar em sequência ou falar no WhatsApp para combinar um atendimento completo.",
              },
            ].map((item, i) => {
              const open = openFaq === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full text-left rounded-2xl border p-4 sm:p-5 mb-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-extrabold text-slate-900">{item.q}</div>
                    <ChevronDown
                      className={cx("w-5 h-5 text-slate-500 transition", open && "rotate-180")}
                    />
                  </div>

                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 text-slate-600 text-sm leading-relaxed">{item.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-10">💙 {BRAND}</p>
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
                <div className="text-sm font-extrabold text-slate-900">Pronto pra agendar?</div>
                <div className="text-xs text-slate-600">Rápido • organizado • profissional</div>
              </div>
            </div>

            <a
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white px-4 py-3 text-sm font-extrabold hover:opacity-95 transition"
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                "Olá! Quero agendar um serviço. Pode me ajudar?"
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
