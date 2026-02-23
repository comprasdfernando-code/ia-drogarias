// app/clinicas/dradudarodrigues/lp/page.tsx
"use client";

import Link from "next/link";

const DASHBOARD_DEMO = "https://iadrogarias.com.br/clinicas/dradudarodrigues/dashboard";
const WHATSAPP = "5511953996537"; // ajuste se quiser outro
const WHATS_LINK = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  "Olá! Vi a LP do Sistema Clínico da Dra Duda e quero uma demonstração/briefing para a minha clínica."
)}`;

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#b88a5a]/25 bg-[#0b0612]/55 px-3 py-1 text-xs text-[#f7d9c4]">
      {children}
    </span>
  );
}

function Card({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-[#2a1c2f]/70 bg-[#06030a]/60 p-5 backdrop-blur hover:border-[#b88a5a]/40 transition">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-2xl border border-[#b88a5a]/25 bg-[#0b0612]/70 grid place-items-center text-lg">
          {icon}
        </div>
        <div>
          <div className="text-base font-semibold text-[#f7d9c4]">{title}</div>
          <div className="mt-1 text-sm text-slate-200/80 leading-relaxed">
            {desc}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs tracking-widest uppercase text-[#b88a5a]">
        {kicker}
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold text-[#f7d9c4]">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-sm md:text-base text-slate-200/80 leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export default function DudaLPPage() {
  return (
    <div className="min-h-screen text-slate-100">
      {/* Fundo rosé + dourado */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#05010a] via-[#07020f] to-[#020007]" />
      <div className="fixed inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full blur-3xl bg-[#f7d9c4]/12" />
        <div className="absolute top-28 right-[-160px] h-[520px] w-[520px] rounded-full blur-3xl bg-[#f2caa2]/10" />
        <div className="absolute bottom-[-220px] left-[-140px] h-[520px] w-[520px] rounded-full blur-3xl bg-[#b88a5a]/10" />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-[#2a1c2f]/70 bg-[#06030a]/55 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl border border-[#b88a5a]/25 bg-[#0b0612]/70 grid place-items-center">
              ✨
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-[#f7d9c4]">
                Dra Duda Rodrigues
              </div>
              <div className="text-[11px] text-slate-200/70">
                Sistema Clínico • Demonstração
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={DASHBOARD_DEMO}
              className="hidden md:inline-flex rounded-xl border border-[#b88a5a]/25 bg-[#0b0612]/60 px-3 py-2 text-sm text-slate-100 hover:border-[#b88a5a]/45 hover:bg-[#0b0612]/75 transition"
            >
              Ver Dashboard
            </a>
            <a
              href={WHATS_LINK}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-xl bg-[#f7d9c4] px-4 py-2 text-sm font-semibold text-[#1b0b1f] hover:bg-[#ffe6d6] transition"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 md:px-6 pt-10 md:pt-14 pb-10">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Pill>rosé + dourado</Pill>
              <Pill>agenda • pacientes • documentos</Pill>
              <Pill>100% online</Pill>
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold text-[#f7d9c4] leading-tight">
              Um sistema clínico com cara de{" "}
              <span className="text-[#b88a5a]">clínica premium</span>.
            </h1>

            <p className="text-base md:text-lg text-slate-200/85 leading-relaxed">
              A Dra Duda precisava sair do Excel/Forms e centralizar tudo:
              <b> cadastro de pacientes</b>, <b>agenda</b>, <b>documentos</b> e
              crescimento do consultório em um painel moderno e organizado.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={DASHBOARD_DEMO}
                className="inline-flex items-center justify-center rounded-xl bg-[#f7d9c4] px-5 py-3 text-sm font-semibold text-[#1b0b1f] hover:bg-[#ffe6d6] transition"
              >
                Ver Demonstração (Dashboard)
              </a>

              <a
                href={WHATS_LINK}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-[#b88a5a]/30 bg-[#0b0612]/60 px-5 py-3 text-sm text-slate-100 hover:border-[#b88a5a]/50 hover:bg-[#0b0612]/75 transition"
              >
                Quero um sistema assim
              </a>
            </div>

            <div className="text-xs text-slate-200/65">
              * Demonstração em evolução contínua (MVP → versão completa).
            </div>
          </div>

          {/* Mock / painel */}
          <div className="rounded-3xl border border-[#2a1c2f]/70 bg-[#06030a]/60 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[#f7d9c4]">
                Preview do Painel
              </div>
              <span className="rounded-full border border-[#b88a5a]/25 bg-[#0b0612]/65 px-2 py-1 text-[11px] text-slate-100">
                MVP
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-[#2a1c2f]/70 bg-[#0b0612]/55 p-4">
                <div className="text-sm text-slate-200/80">Hoje</div>
                <div className="mt-1 text-xl font-semibold text-[#f7d9c4]">
                  Agenda organizada
                </div>
                <div className="mt-1 text-sm text-slate-200/70">
                  Status: Agendado • Confirmado • Concluído • Faltou • Cancelado
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#2a1c2f]/70 bg-[#0b0612]/55 p-4">
                  <div className="text-sm text-slate-200/80">Pacientes</div>
                  <div className="mt-1 text-2xl font-semibold text-[#f7d9c4]">
                    Cadastro
                  </div>
                  <div className="mt-1 text-xs text-slate-200/65">
                    tags • origem • observações
                  </div>
                </div>

                <div className="rounded-2xl border border-[#2a1c2f]/70 bg-[#0b0612]/55 p-4">
                  <div className="text-sm text-slate-200/80">Documentos</div>
                  <div className="mt-1 text-2xl font-semibold text-[#f7d9c4]">
                    Aceite
                  </div>
                  <div className="mt-1 text-xs text-slate-200/65">
                    snapshot • data/hora • registro
                  </div>
                </div>
              </div>

              <a
                href={DASHBOARD_DEMO}
                className="mt-1 inline-flex items-center justify-center rounded-2xl border border-[#b88a5a]/25 bg-[#0b0612]/60 px-4 py-3 text-sm text-slate-100 hover:border-[#b88a5a]/50 hover:bg-[#0b0612]/75 transition"
              >
                Abrir painel demo →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Problema / Solução */}
      <section className="mx-auto max-w-6xl px-5 md:px-6 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <SectionTitle
              kicker="o problema"
              title="Planilhas e ferramentas soltas travam o crescimento"
              subtitle="Excel + Forms + CRM limitado = informação fragmentada, pouca automação e pouca visão do consultório."
            />
            <div className="grid gap-3">
              {[
                "Cadastro disperso e difícil de achar informações",
                "Agenda sem confirmação organizada",
                "Documentos em papel e sem rastreabilidade",
                "Falta de histórico centralizado do paciente",
              ].map((t) => (
                <div
                  key={t}
                  className="rounded-2xl border border-[#2a1c2f]/70 bg-[#06030a]/60 p-4 text-sm text-slate-200/85"
                >
                  ✅ {t}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <SectionTitle
              kicker="a solução"
              title="Tudo em um único painel, com identidade premium"
              subtitle="Sistema feito sob medida para o fluxo da clínica — com rosé + dourado e experiência de alto padrão."
            />

            <div className="grid gap-3">
              <Card
                icon="🧍‍♀️"
                title="Pacientes centralizados"
                desc="Cadastro completo, tags, origem e observações — tudo fácil de buscar."
              />
              <Card
                icon="📅"
                title="Agenda inteligente"
                desc="Agendamentos por dia, status por atendimento e controle organizado."
              />
              <Card
                icon="📄"
                title="Documentos digitais"
                desc="Termos com snapshot + aceite com registro de data/hora e dispositivo."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section className="mx-auto max-w-6xl px-5 md:px-6 py-10">
        <SectionTitle
          kicker="módulos"
          title="O que está incluído no sistema da Dra Duda"
          subtitle="MVP já funcional e evoluindo para versão completa (CRM, automações e financeiro avançado)."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card
            icon="📌"
            title="Dashboard"
            desc="Visão geral e atalhos rápidos. Base para métricas e relatórios."
          />
          <Card
            icon="🧾"
            title="Documentos"
            desc="Modelos + geração por paciente + assinatura com checkbox (MVP)."
          />
          <Card
            icon="🗂"
            title="CRM"
            desc="Organização por status e acompanhamento de relacionamento (próximas fases)."
          />
          <Card
            icon="💰"
            title="Financeiro"
            desc="Valores por atendimento e base para relatórios por período (evolutivo)."
          />
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-5 md:px-6 py-12">
        <div className="rounded-3xl border border-[#b88a5a]/25 bg-[#06030a]/65 p-7 md:p-9 backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="text-xs tracking-widest uppercase text-[#b88a5a]">
                pronto para elevar o padrão?
              </div>
              <div className="text-2xl md:text-3xl font-semibold text-[#f7d9c4]">
                Quer uma LP + Sistema com identidade premium?
              </div>
              <div className="text-sm md:text-base text-slate-200/80">
                Eu monto a LP, deixo a demo no ar e evoluímos o sistema por fases.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={DASHBOARD_DEMO}
                className="inline-flex items-center justify-center rounded-xl border border-[#b88a5a]/30 bg-[#0b0612]/60 px-5 py-3 text-sm text-slate-100 hover:border-[#b88a5a]/50 hover:bg-[#0b0612]/75 transition"
              >
                Ver demo agora
              </a>
              <a
                href={WHATS_LINK}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[#f7d9c4] px-5 py-3 text-sm font-semibold text-[#1b0b1f] hover:bg-[#ffe6d6] transition"
              >
                Pedir orçamento no WhatsApp
              </a>
            </div>
          </div>

          <div className="mt-5 text-xs text-slate-200/60">
            Assinado: <span className="text-slate-100 font-semibold">Tech Fernando Pereira</span>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-slate-200/55">
        © {new Date().getFullYear()} IA Drogarias • IA Clínicas — Dra Duda Rodrigues (demo)
      </footer>
    </div>
  );
}