"use client";

import Image from "next/image";
import Link from "next/link";

const WHATS = "5511983273348";

function zap(msg: string) {
  return `https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`;
}

const categorias = [
  "Café da Manhã",
  "Românticas",
  "Aniversário",
  "Infantil",
  "Premium",
  "Personalizadas",
];

const produtos = [
  {
    nome: "Cesta Café da Manhã",
    preco: "A partir de R$ 89,90",
    img: "https://cestascompany.com.br/cdn/shop/files/background-editor_output_6a624b7f-400e-4a11-81d3-2fbab87f904a.png?v=1745497334&width=493",
  },
  {
    nome: "Cesta Romântica",
    preco: "A partir de R$ 119,90",
    img: "https://down-br.img.susercontent.com/file/br-11134207-7r98o-mafvabjz9c6x51@resize_w900_nl.webp",
  },
  {
    nome: "Cesta Premium",
    preco: "A partir de R$ 159,90",
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHGbjt7PRoC3p2cHG8x09RfdKSoa7h9HUOEQ&s",
  },
  {
    nome: "Cesta Infantil",
    preco: "A partir de R$ 99,90",
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSr9YLgUKCuINxuhVxckZnJYhADi1xzQfoREQ&s",
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#fff8f4] text-[#3a2020]">
      <header className="sticky top-0 z-40 border-b border-rose-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="leading-none">
            <p className="font-serif text-3xl font-bold text-[#9b2f45]">
              Cestas ♡
            </p>
            <p className="-mt-1 font-serif text-xl italic text-[#b85b6a]">
              by Gisa
            </p>
          </div>

          <nav className="hidden gap-6 text-sm font-medium md:flex">
            <a href="#cestas">Cestas</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#depoimentos">Depoimentos</a>
            <a href="#contato">Contato</a>
          </nav>

          <a
            href={zap("Olá! Quero fazer um pedido na Cestas by Gisa 🧺")}
            target="_blank"
            className="rounded-full bg-[#c9475f] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105"
          >
            Pedir no WhatsApp
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-r from-[#fff1ec] to-[#ffd8dd]">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
          <div>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#c9475f] shadow">
              Presentes que encantam 💝
            </span>

            <h1 className="mt-6 font-serif text-4xl font-bold leading-tight text-[#8f2438] md:text-6xl">
              Surpreenda quem você ama com uma cesta especial
            </h1>

            <p className="mt-5 max-w-xl text-lg text-[#5f4444]">
              Cestas de café da manhã, românticas, infantis e personalizadas
              com muito carinho em cada detalhe.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={zap("Olá! Quero ver os modelos de cestas disponíveis 🧺✨")}
                target="_blank"
                className="rounded-full bg-[#c9475f] px-7 py-4 text-center font-bold text-white shadow-xl"
              >
                Ver modelos no WhatsApp
              </a>

              <a
                href="#cestas"
                className="rounded-full border border-[#c9475f] px-7 py-4 text-center font-bold text-[#c9475f]"
              >
                Ver cestas
              </a>
            </div>

            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                🚚 <br /> Entrega combinada
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                🎁 <br /> Personalizada
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                💖 <br /> Feita com amor
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] bg-white p-3 shadow-2xl">
              <Image
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYOSvywUMKHATeAvkD0UBCz9ZJ02fD8sZ_lQ&s"
                alt="Cesta de café da manhã"
                width={900}
                height={700}
                className="h-[420px] w-full rounded-[1.5rem] object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-3 md:grid-cols-6">
          {categorias.map((cat) => (
            <a
              key={cat}
              href={zap(`Olá! Quero opções de cestas: ${cat}`)}
              target="_blank"
              className="rounded-2xl border border-rose-100 bg-white px-4 py-4 text-center text-sm font-bold shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              {cat}
            </a>
          ))}
        </div>
      </section>

      <section id="cestas" className="mx-auto max-w-7xl px-4 py-10">
        <div className="text-center">
          <h2 className="font-serif text-4xl font-bold text-[#8f2438]">
            Cestas mais pedidas
          </h2>
          <p className="mt-2 text-[#6b5252]">
            Escolha um modelo e personalize pelo WhatsApp.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {produtos.map((p) => (
            <article
              key={p.nome}
              className="overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-lg"
            >
              <Image
                src={p.img}
                alt={p.nome}
                width={600}
                height={450}
                className="h-56 w-full object-cover"
              />

              <div className="p-5">
                <h3 className="text-lg font-bold">{p.nome}</h3>
                <p className="mt-1 text-sm font-semibold text-[#c9475f]">
                  {p.preco}
                </p>

                <a
                  href={zap(`Olá! Quero saber mais sobre: ${p.nome}`)}
                  target="_blank"
                  className="mt-4 block rounded-full bg-[#c9475f] px-5 py-3 text-center text-sm font-bold text-white"
                >
                  Pedir esta cesta
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="como-funciona"
        className="bg-white px-4 py-14"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-serif text-4xl font-bold text-[#8f2438]">
            Como funciona
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {[
              ["1", "Escolha a cesta", "Veja os modelos disponíveis."],
              ["2", "Chame no WhatsApp", "Personalize do seu jeito."],
              ["3", "Preparamos", "Tudo montado com carinho."],
              ["4", "Entregamos", "Surpresa pronta para emocionar."],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-3xl bg-[#fff8f4] p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#c9475f] text-xl font-bold text-white">
                  {n}
                </div>
                <h3 className="font-bold">{t}</h3>
                <p className="mt-2 text-sm text-[#6b5252]">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="depoimentos" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center font-serif text-4xl font-bold text-[#8f2438]">
          Clientes encantados
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            "A cesta veio perfeita, muito capricho!",
            "Entrega combinada certinho e tudo lindo.",
            "Foi uma surpresa maravilhosa, recomendo!",
          ].map((d, i) => (
            <div key={i} className="rounded-3xl bg-white p-6 shadow-md">
              <p className="text-yellow-500">★★★★★</p>
              <p className="mt-3 text-sm">“{d}”</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#c9475f] px-4 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <p className="text-sm font-semibold">Instagram</p>
            <h2 className="text-3xl font-bold">@cestas_by_gisa</h2>
            <p className="mt-1 text-white/80">
              Acompanhe novidades, modelos e entregas.
            </p>
          </div>

          <a
            href="https://www.instagram.com/cestas_by_gisa"
            target="_blank"
            className="rounded-full bg-white px-7 py-4 font-bold text-[#c9475f]"
          >
            Ver no Instagram
          </a>
        </div>
      </section>

      <section id="contato" className="px-4 py-14">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-gradient-to-r from-[#8f2438] to-[#c9475f] p-8 text-center text-white shadow-xl">
          <h2 className="font-serif text-4xl font-bold">
            Faça sua surpresa hoje
          </h2>
          <p className="mt-3">
            Chame no WhatsApp e monte uma cesta especial.
          </p>

          <a
            href={zap("Olá! Quero montar uma cesta especial com a Cestas by Gisa 💝")}
            target="_blank"
            className="mt-6 inline-block rounded-full bg-white px-8 py-4 font-bold text-[#c9475f]"
          >
            Pedir agora no WhatsApp
          </a>
        </div>
      </section>

      <footer className="border-t border-rose-100 bg-[#fff1ec] px-4 py-10">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
          <div>
            <p className="font-serif text-3xl font-bold text-[#9b2f45]">
              Cestas ♡
            </p>
            <p className="font-serif text-xl italic text-[#b85b6a]">
              by Gisa
            </p>
            <p className="mt-4 text-sm text-[#6b5252]">
              Presentes que encantam, momentos que ficam.
            </p>
          </div>

          <div>
            <h3 className="font-bold">Links rápidos</h3>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <a href="#cestas">Cestas</a>
              <a href="#como-funciona">Como funciona</a>
              <a href="#depoimentos">Depoimentos</a>
              <a href="#contato">Contato</a>
            </div>
          </div>

          <div>
            <h3 className="font-bold">Atendimento</h3>
            <p className="mt-3 text-sm">WhatsApp: (11) 98327-3348</p>
            <p className="mt-2 text-sm">Segunda a sábado</p>
          </div>

          <div>
            <h3 className="font-bold">IA Drogarias</h3>
            <p className="mt-3 text-sm text-[#6b5252]">
              Conheça também nossa farmácia online.
            </p>
            <Link
              href="/fv"
              className="mt-3 inline-block rounded-full bg-[#111] px-5 py-3 text-sm font-bold text-white"
            >
              Farmácia Online 💊
            </Link>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-7xl text-xs text-[#6b5252]">
          © 2026 Cestas by Gisa. Desenvolvido com carinho.
        </p>
      </footer>

      {/* BOTÃO FLUTUANTE PADRÃO - FARMÁCIA ONLINE */}
      <Link
        href="/fv"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full border border-[#c9a227] bg-black px-6 py-4 text-sm font-bold text-white shadow-[0_0_18px_rgba(201,162,39,0.45)] transition hover:scale-105"
      >
        Farmácia Online <span>💊</span>
      </Link>
    </main>
  );
}