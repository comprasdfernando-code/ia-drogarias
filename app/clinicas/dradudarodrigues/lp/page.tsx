"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

const WHATSAPP_NUMBER = "5511968730302";
const WHATSAPP_MSG =
  "Olá Dra Duda, quero garantir minha vaga na Mentoria VIP em São Paulo. Ainda tem disponibilidade?";

function waLink() {
  const text = encodeURIComponent(WHATSAPP_MSG);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

function Badge({ children }: { children: any }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#b88a5a]/30 bg-[#0b0612]/60 px-3 py-1 text-xs md:text-sm text-[#f7d9c4] backdrop-blur">
      {children}
    </span>
  );
}

function SectionTitle({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-2">
      {kicker ? <div className="text-sm text-[#f2caa2]">{kicker}</div> : null}
      <h2 className="text-2xl md:text-3xl font-extrabold text-[#f7d9c4]">{title}</h2>
      {subtitle ? (
        <p className="max-w-3xl text-base md:text-lg text-slate-200/85">{subtitle}</p>
      ) : null}
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: any;
}) {
  return (
    <div className="rounded-3xl border border-[#2a1c2f]/70 bg-[#0b0612]/55 p-6 md:p-7 backdrop-blur">
      <div className="text-lg md:text-xl font-semibold text-[#f7d9c4]">{title}</div>
      <div className="mt-3 text-base md:text-lg leading-relaxed text-slate-200/90">
        {children}
      </div>
    </div>
  );
}

function CTA({ variant = "primary" }: { variant?: "primary" | "outline" }) {
  if (variant === "outline") {
    return (
      <a
        href={waLink()}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#b88a5a]/35 bg-[#0b0612]/55 px-6 py-3 text-base font-semibold text-[#f7d9c4] hover:bg-[#0b0612]/80"
      >
        Falar no WhatsApp
        <span aria-hidden>→</span>
      </a>
    );
  }

  return (
    <a
      href={waLink()}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f7d9c4] to-[#f2caa2] px-6 py-3 text-base md:text-lg font-extrabold text-[#140a18] shadow-lg shadow-[#b88a5a]/10 hover:opacity-95"
    >
      Garantir minha vaga no WhatsApp
      <span aria-hidden>→</span>
    </a>
  );
}

export default function Page() {
  const gallery = useMemo(
    () => [
      { src: "/clinicas/dradudarodrigues/lp/flyer.jpg", alt: "Mentoria VIP — Flyer" },
      { src: "/clinicas/dradudarodrigues/lp/story1.jpg", alt: "Story — Faça sua mentoria" },
      { src: "/clinicas/dradudarodrigues/lp/story2.jpg", alt: "Story — Ao vivo" },
    ],
    []
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      {/* HERO */}
      <section className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge>Mentoria VIP • Presencial</Badge>
            <Badge>São Paulo</Badge>
            <Badge>Vagas limitadas</Badge>
            <Badge>AO VIVO de Miami</Badge>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            <span className="text-[#f7d9c4]">Mentoria VIP</span>{" "}
            <span className="text-slate-100">— Anatomia, Técnicas e Intercorrências</span>
          </h1>

          <p className="text-base md:text-xl text-slate-200/90 max-w-xl leading-relaxed">
            Mentoria premium para profissionais da saúde que querem dominar estética facial com{" "}
            <span className="text-[#f2caa2] font-semibold">segurança, raciocínio anatômico</span>{" "}
            e execução prática.
          </p>

          <div className="flex flex-wrap gap-2 text-sm md:text-base text-slate-200/85">
            <span className="rounded-full border border-[#b88a5a]/20 bg-[#0b0612]/40 px-3 py-1">
              💉 Toxina Botulínica
            </span>
            <span className="rounded-full border border-[#b88a5a]/20 bg-[#0b0612]/40 px-3 py-1">
              💉 Fios de PDO
            </span>
            <span className="rounded-full border border-[#b88a5a]/20 bg-[#0b0612]/40 px-3 py-1">
              💉 Ácido Hialurônico
            </span>
            <span className="rounded-full border border-[#b88a5a]/20 bg-[#0b0612]/40 px-3 py-1">
              💎 Full Face
            </span>
            <span className="rounded-full border border-[#b88a5a]/20 bg-[#0b0612]/40 px-3 py-1">
              🧠 Intercorrências
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center pt-2">
            <CTA />
            <CTA variant="outline" />
          </div>

          <div className="text-sm md:text-base text-slate-300/85">
            ⚠ <span className="text-[#f7d9c4] font-bold">Apenas 5 vagas</span>. Quando fechar, encerra.
          </div>
        </div>

        {/* FOTO HERO */}
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#f7d9c4]/10 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border border-[#2a1c2f]/70 bg-[#0b0612]/55">
            <div className="relative aspect-[4/5]">
              <Image
                src="/clinicas/dradudarodrigues/lp/hero-duda.jpg"
                alt="Dra. Duda Rodrigues"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Faixa preço/escassez */}
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs md:text-sm text-slate-300/90">Investimento</div>
                  <div className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-100">
                    5x <span className="text-[#f7d9c4]">R$ 649,00</span>
                  </div>
                  <div className="mt-2 text-xs md:text-sm text-slate-300/90">
                    Bônus: kit aluno • paciente modelo • certificado • coffee break
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs md:text-sm text-slate-300/90">Contato</div>
                  <div className="mt-1 text-sm md:text-base font-semibold text-[#f2caa2]">
                    (11) 96873-0302
                  </div>
                  <div className="mt-2">
                    <a
                      href={waLink()}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs md:text-sm text-[#f7d9c4] hover:text-[#f2caa2]"
                    >
                      Abrir WhatsApp →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* selo */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>Interface premium</Badge>
            <Badge>Mentoria VIP</Badge>
            <Badge>SP • Próxima semana</Badge>
          </div>
        </div>
      </section>

      {/* DIVISOR */}
      <div className="my-10 h-px w-full bg-gradient-to-r from-transparent via-[#b88a5a]/30 to-transparent" />

      {/* SEÇÃO: AUTORIDADE + MIAMI */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card title="Quem é a Dra. Duda Rodrigues">
          Biomédica esteta, há 4 anos aprofundando estudos principalmente em{" "}
          <b>anatomia facial</b> para oferecer o melhor em procedimentos estéticos,
          conforto e principalmente <b>segurança</b> aos pacientes.
        </Card>

        <div className="rounded-3xl border border-[#2a1c2f]/70 bg-[#0b0612]/55 p-6 md:p-7 backdrop-blur">
          <div className="text-lg md:text-xl font-semibold text-[#f7d9c4]">
            Participação internacional AO VIVO
          </div>
          <div className="mt-3 text-base md:text-lg leading-relaxed text-slate-200/90">
            Transmissão direta de Miami com{" "}
            <span className="text-[#f2caa2] font-bold">Dra. Patrícia Oyole</span>,
            referência mundial em anatomia facial.
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl border border-[#b88a5a]/20 bg-[#06030a]/60">
              <div className="relative aspect-[4/5]">
                <Image
                  src="/clinicas/dradudarodrigues/lp/patricia.jpg"
                  alt="Dra. Patrícia Oyole"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#b88a5a]/20 bg-[#06030a]/60 p-4">
              <div className="text-sm md:text-base font-semibold text-slate-100">
                O que isso muda pra você:
              </div>
              <ul className="mt-3 space-y-2 text-sm md:text-base text-slate-200/90 list-disc pl-5">
                <li>Raciocínio anatômico real (não “macete”)</li>
                <li>Mais segurança em cada plano facial</li>
                <li>Prevenção e conduta em intercorrências</li>
                <li>Posicionamento premium com autoridade</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO: CONTEÚDO */}
      <section className="mt-12">
        <SectionTitle
          kicker="Conteúdo prático + anatomia"
          title="O que você vai dominar na Mentoria VIP"
          subtitle="A mentoria é focada em técnica, segurança e tomada de decisão clínica para você destravar e evoluir rápido."
        />

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card title="💉 Toxina Botulínica">
            Mapeamento facial • aplicação estratégica • naturalidade • correções.
          </Card>

          <Card title="💉 Preenchimento com Ácido Hialurônico">
            Planejamento facial • harmonização equilibrada • Full Face estruturado.
          </Card>

          <Card title="💉 Lifting Facial com Fios de PDO">
            Vetores corretos • indicações seguras • planejamento anatômico.
          </Card>

          <Card title="🧠 Intercorrências">
            Prevenção • conduta • raciocínio clínico • segurança em cada plano.
          </Card>
        </div>
      </section>

      {/* GALERIA / PROVAS VISUAIS */}
      <section className="mt-12">
        <SectionTitle
          kicker="Prova visual"
          title="Materiais e destaques da mentoria"
          subtitle="Visual premium, mensagem clara e direto ao ponto (igual seus stories)."
        />

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {gallery.map((g) => (
            <div
              key={g.src}
              className="overflow-hidden rounded-3xl border border-[#2a1c2f]/70 bg-[#0b0612]/55"
            >
              <div className="relative aspect-[9/16]">
                <Image src={g.src} alt={g.alt} fill className="object-cover" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BÔNUS + VAGAS */}
      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <Card title="🎁 Bônus inclusos">
          <ul className="list-disc pl-5 space-y-2">
            <li>Kit aluno</li>
            <li>Paciente modelo</li>
            <li>Certificado</li>
            <li>Coffee break</li>
          </ul>
        </Card>

        <Card title="⚠ Vagas limitadas (VIP)">
          Turma reduzida para atenção individual: <b>apenas 5 vagas</b>.  
          Se você quer se destacar no mercado de estética facial com segurança, essa é a chance.
        </Card>
      </section>

      {/* CTA FINAL */}
      <section className="mt-12 rounded-3xl border border-[#2a1c2f]/70 bg-gradient-to-r from-[#0b0612]/70 to-[#06030a]/70 p-8 backdrop-blur">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-slate-100">
              Mentoria VIP —{" "}
              <span className="text-[#f7d9c4]">eleve sua carreira</span>
            </div>
            <div className="mt-2 text-base md:text-lg text-slate-200/85">
              Anatomia • técnicas • intercorrências • transmissão ao vivo de Miami.
            </div>
            <div className="mt-3 text-sm md:text-base text-slate-300">
              WhatsApp: <span className="text-[#f2caa2] font-semibold">(11) 96873-0302</span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <CTA />
            <div className="text-xs md:text-sm text-slate-400">
              Ao clicar, abre o WhatsApp com mensagem pronta.
            </div>
          </div>
        </div>
      </section>

      {/* rodapé */}
      <footer className="mt-10 flex flex-col gap-2 text-center text-xs text-slate-500">
        <div>Página criada para alta conversão • LP premium rosé + dourado • IA Drogarias</div>
        <div className="opacity-80">Produzido por Tech Fernando Pereira</div>
        <div className="pt-2">
          <Link
            href="/clinicas/dradudarodrigues/dashboard"
            className="text-[#f2caa2]/80 hover:text-[#f7d9c4]"
          >
            Voltar para o sistema
          </Link>
        </div>
      </footer>
    </main>
  );
}