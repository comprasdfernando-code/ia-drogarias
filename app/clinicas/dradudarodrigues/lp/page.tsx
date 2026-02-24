"use client";

import Image from "next/image";
import Link from "next/link";

const WHATSAPP = "5511968730302"; // do criativo (11) 96873-0302
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  "Olá, Dra. Duda! Quero informações sobre a Mentoria VIP (São Paulo)."
)}`;

const chips = [
  "Mentoria VIP • Presencial",
  "São Paulo",
  "Vagas limitadas",
  "AO VIVO de Miami",
];

const topics = [
  "Toxina Botulínica",
  "Lifting facial com Fios de PDO",
  "Preenchimento com Ácido Hialurônico",
  "Full Face",
  "Intercorrências + condutas",
  "Anatomia facial (ao vivo)",
];

const bonuses = ["Kit aluno", "Paciente modelo", "Certificado", "Coffee break"];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 md:py-16">
      {/* topo */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5" />
          <div>
            <div className="text-sm font-semibold tracking-wide text-white/90">
              Dra. Duda Rodrigues
            </div>
            <div className="text-xs text-white/60">
              Biomédica Esteta • Harmonização Facial
            </div>
          </div>
        </div>

        <Link
          href={WHATSAPP_LINK}
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Falar no WhatsApp
        </Link>
      </header>

      {/* hero */}
      <section className="mt-10 grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <span
                key={c}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85"
              >
                {c}
              </span>
            ))}
          </div>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            <span className="text-white">Mentoria VIP</span>{" "}
            <span className="text-white/70">— Anatomia, Técnicas e</span>{" "}
            <span className="text-white">Intercorrências</span>
          </h1>

          <p className="mt-4 text-base leading-relaxed text-white/75 md:text-lg">
            Mentoria premium para profissionais da saúde que querem dominar a
            estética facial com{" "}
            <span className="text-white font-semibold">segurança</span>,{" "}
            <span className="text-white font-semibold">raciocínio anatômico</span>{" "}
            e execução prática.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={WHATSAPP_LINK}
              className="rounded-2xl bg-white px-6 py-3 text-center text-sm font-extrabold text-black hover:bg-white/90"
            >
              Quero minha vaga
            </Link>

            <a
              href="#conteudo"
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
            >
              Ver conteúdo
            </a>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KPI title="Formato" value="VIP" />
            <KPI title="Local" value="São Paulo" />
            <KPI title="Vagas" value="Limitadas" />
            <KPI title="Extra" value="AO VIVO Miami" />
          </div>

          <div className="mt-6 text-sm text-white/60">
            Contato: <span className="text-white/85 font-semibold">(11) 96873-0302</span>
          </div>
        </div>

        {/* card imagem */}
        <div className="relative">
          <div className="absolute -inset-3 rounded-[32px] bg-white/5 blur-xl" />
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/40 p-4">
            {/* Troque a imagem abaixo pelo seu asset local (recomendado) */}
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/10">
              <Image
                src="/clinicas/dradudarodrigues/lp/hero.jpg"
                alt="Mentoria VIP Dra. Duda Rodrigues"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white/90">
                Mentoria VIP • Dra. Duda Rodrigues
              </div>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                Inscrições abertas
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* conteudo */}
      <section id="conteudo" className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white md:text-3xl">
              O que você vai aprender
            </h2>
            <p className="mt-2 text-base text-white/70">
              Conteúdo direto ao ponto, com prática e segurança clínica.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {topics.map((t) => (
            <Card key={t} title={t} />
          ))}
        </div>
      </section>

      {/* participação */}
      <section className="mt-14 grid gap-6 md:grid-cols-2 md:items-stretch">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <h3 className="text-xl font-extrabold text-white">
            Participação exclusiva AO VIVO
          </h3>
          <p className="mt-2 text-base text-white/70">
            Transmissão ao vivo direto de Miami com{" "}
            <span className="text-white font-semibold">Dra. Patrícia Oyole</span>{" "}
            (referência mundial em anatomia).
          </p>

          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>• Anatomia facial aplicada na estética</li>
            <li>• Segurança, pontos de risco e planejamento</li>
            <li>• Discussão de intercorrências</li>
          </ul>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-black/35 p-6">
          <h3 className="text-xl font-extrabold text-white">Bônus</h3>
          <p className="mt-2 text-base text-white/70">
            Experiência completa para você sair pronto(a) para aplicar.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {bonuses.map((b) => (
              <span
                key={b}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85"
              >
                {b}
              </span>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-white/70">Investimento</div>
            <div className="mt-1 text-3xl font-extrabold text-white">
              5x de R$ 649,00
            </div>
            <div className="mt-1 text-xs text-white/55">
              * Valores e condições conforme divulgação oficial da mentoria.
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mt-14">
        <div className="rounded-[34px] border border-white/10 bg-white/5 p-7 md:p-10">
          <h3 className="text-2xl font-extrabold text-white md:text-3xl">
            Pronto(a) para elevar sua carreira?
          </h3>
          <p className="mt-2 text-base text-white/70 md:text-lg">
            Garanta sua vaga na Mentoria VIP e se destaque no mercado da estética
            facial.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={WHATSAPP_LINK}
              className="rounded-2xl bg-white px-7 py-3 text-center text-sm font-extrabold text-black hover:bg-white/90"
            >
              Chamar no WhatsApp
            </Link>
            <Link
              href="https://www.instagram.com/dra.dudarodrigues/"
              target="_blank"
              className="rounded-2xl border border-white/15 bg-black/30 px-7 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
            >
              Ver Instagram
            </Link>
          </div>
        </div>
      </section>

      {/* rodapé */}
      <footer className="mt-10 pb-10 text-center text-xs text-white/45">
        © {new Date().getFullYear()} • Dra. Duda Rodrigues • Landing Page (prévia)
      </footer>

      {/* WhatsApp floating */}
      <a
        href={WHATSAPP_LINK}
        className="fixed bottom-6 right-6 z-50 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-extrabold text-white backdrop-blur hover:bg-white/15"
      >
        WhatsApp
      </a>
    </main>
  );
}

function KPI({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-[11px] font-semibold text-white/60">{title}</div>
      <div className="mt-1 text-sm font-extrabold text-white">{value}</div>
    </div>
  );
}

function Card({ title }: { title: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-5 hover:bg-white/7">
      <div className="text-base font-extrabold text-white">{title}</div>
      <div className="mt-1 text-sm text-white/70">
        Conteúdo prático + raciocínio anatômico + segurança no atendimento.
      </div>
    </div>
  );
}