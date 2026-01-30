// app/dayfestas/page.tsx
"use client";

import Image from "next/image";
import SectionTitle from "./_components/SectionTitle";
import Gallery from "./_components/Gallery";
import Services from "./_components/Services";
import HowItWorks from "./_components/HowItWorks";
import Testimonials from "./_components/Testimonials";
import WhatsAppFloat from "./_components/WhatsAppFloat";

const BRAND = {
  name: "Day Festass",
  tagline: "Toque especial em festas",
  whatsapp: "5511999999999", // <<< TROQUE AQUI
  instagram: "https://www.instagram.com/day.festass",
};

const gallery = [
  "/dayfestas/g1.jpg",
  "/dayfestas/g2.jpg",
  "/dayfestas/g3.jpg",
  "/dayfestas/g4.jpg",
  "/dayfestas/g5.jpg",
  "/dayfestas/g6.jpg",
];

function wppLink(text: string) {
  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;
}

export default function DayFestasPage() {
  const msg = `Olá! Vim pelo site da ${BRAND.name}. Quero orçamento para uma festa com toque especial ✨`;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Topo */}
      <header className="sticky top-0 z-40">
        <div className="backdrop-blur bg-white/70 border-b border-black/10">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl overflow-hidden bg-white ring-1 ring-black/10">
                <Image
                  src="/dayfestas/logo.png"
                  alt="Logo"
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="leading-tight">
                <p className="font-semibold tracking-tight">{BRAND.name}</p>
                <p className="text-xs text-neutral-600">{BRAND.tagline}</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-700">
              <a href="#servicos" className="hover:text-black">Serviços</a>
              <a href="#galeria" className="hover:text-black">Galeria</a>
              <a href="#como" className="hover:text-black">Como funciona</a>
              <a href="#depo" className="hover:text-black">Depoimentos</a>
            </nav>

            <a
              href={wppLink(msg)}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl px-4 py-2 text-sm font-semibold bg-black text-white hover:opacity-90 transition"
            >
              Orçamento
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pt-10 md:pt-16 pb-10 md:pb-14">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ring-1 ring-black/10 bg-white/70">
              ✨ Premium • delicado • inesquecível
            </p>

            <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight">
              Transformando festas em <span className="italic">memórias</span> cheias de encanto.
            </h1>

            <p className="mt-4 text-neutral-700">
              Mini festas, papelaria personalizada e decoração com carinho em cada detalhe —
              para celebrar do jeitinho que você sonha.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={wppLink(msg)}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl px-5 py-3 text-sm font-semibold bg-black text-white hover:opacity-90 transition"
              >
                Chamar no WhatsApp
              </a>

              <a
                href={BRAND.instagram}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl px-5 py-3 text-sm font-semibold bg-white ring-1 ring-black/10 hover:bg-neutral-100 transition"
              >
                Ver Instagram
              </a>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { t: "Capricho", d: "Detalhes finos" },
                { t: "Carinho", d: "Em cada criação" },
                { t: "Premium", d: "Visual elegante" },
              ].map((b) => (
                <div key={b.t} className="rounded-3xl bg-white ring-1 ring-black/10 p-4 shadow-sm">
                  <p className="text-sm font-semibold">{b.t}</p>
                  <p className="text-xs text-neutral-600 mt-1">{b.d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] overflow-hidden bg-white ring-1 ring-black/10 shadow-sm">
            <div className="relative aspect-[4/5]">
              <Image src="/dayfestas/hero.jpg" alt="Hero" fill className="object-cover" priority />
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="rounded-[2rem] bg-white ring-1 ring-black/10 p-6 md:p-10 shadow-sm">
          <SectionTitle
            kicker="💖 Sobre"
            title="Um toque especial para celebrar do seu jeito"
            subtitle="A Day Festass transforma momentos especiais em lembranças inesquecíveis, com criatividade, delicadeza e atenção aos mínimos detalhes."
          />
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[
              { title: "Personalização", desc: "Tudo pensado para o tema e estilo da sua festa." },
              { title: "Elegância", desc: "Composição harmônica, delicada e com cara premium." },
              { title: "Praticidade", desc: "Atendimento rápido e orçamento direto no WhatsApp." },
            ].map((c) => (
              <div key={c.title} className="rounded-3xl bg-neutral-50 ring-1 ring-black/10 p-5">
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm text-neutral-700 mt-2">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="mx-auto max-w-6xl px-4 pb-14">
        <SectionTitle
          kicker="✨ Serviços"
          title="Criações que encantam"
          subtitle="Escolha o que combina com sua celebração — e a gente faz acontecer com carinho."
        />
        <div className="mt-6">
          <Services />
        </div>
      </section>

      {/* GALERIA */}
      <section id="galeria" className="mx-auto max-w-6xl px-4 pb-14">
        <SectionTitle
          kicker="📸 Galeria"
          title="Detalhes que fazem diferença"
          subtitle="Fotos reais para você sentir o estilo e o capricho de perto."
        />
        <div className="mt-6">
          <Gallery images={gallery} />
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como" className="mx-auto max-w-6xl px-4 pb-14">
        <SectionTitle
          kicker="✅ Como funciona"
          title="Simples, rápido e do jeitinho que você precisa"
          subtitle="Um processo leve para você curtir a festa e a gente cuidar do encanto."
        />
        <div className="mt-6">
          <HowItWorks />
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depo" className="mx-auto max-w-6xl px-4 pb-16">
        <SectionTitle
          kicker="🌟 Depoimentos"
          title="Quem faz, recomenda"
          subtitle="Feedbacks que mostram o carinho por trás de cada projeto."
        />
        <div className="mt-6">
          <Testimonials />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-[2rem] bg-black text-white p-8 md:p-12">
          <p className="text-xs opacity-80">Seu momento merece um toque especial ✨</p>
          <h3 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">
            Vamos criar uma festa linda e inesquecível?
          </h3>
          <p className="mt-3 text-white/80 max-w-2xl">
            Me chama no WhatsApp e me conta o tema, a data e o que você imagina. Eu te envio uma proposta bem rapidinho.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={wppLink(msg)}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl px-5 py-3 text-sm font-semibold bg-white text-black hover:opacity-90 transition"
            >
              Solicitar orçamento agora
            </a>
            <a
              href="#galeria"
              className="rounded-2xl px-5 py-3 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/10 transition"
            >
              Ver trabalhos
            </a>
          </div>
        </div>
      </section>

      {/* WhatsApp fixo */}
      <WhatsAppFloat phone={BRAND.whatsapp} message={msg} />
    </main>
  );
}
