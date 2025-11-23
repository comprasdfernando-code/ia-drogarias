import Image from "next/image";
import Link from "next/link";

export default function DaniSoundHome() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-20">

      {/* ===================== HERO ===================== */}
      <section className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-red-900/40 shadow-xl">
        <Image
          src="/danisound/fachada-dia.jpg"
          alt="Dani Sound Fachada"
          fill
          className="object-cover brightness-75"
        />

        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        <div className="absolute bottom-10 left-10 text-white space-y-5">
          <h1 className="text-4xl font-bold drop-shadow-xl">
            Auto Elétrico & Som Automotivo
          </h1>

          <p className="text-lg text-zinc-300 max-w-xl drop-shadow">
            Multimídia, LED, alarmes, bloqueadores, elétrica em geral e
            acabamento profissional — tudo na Av. Rodolfo Pirani.
          </p>

          <div className="flex gap-4">
            <a
              href="https://wa.me/5511977844066?text=Olá,+quero+um+orçamento!"
              target="_blank"
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full text-white shadow-red-700/40 shadow-lg"
            >
              Pedir orçamento
            </a>

            <Link
              href="/autoeletrico/danisound/servicos"
              className="border border-white/40 px-6 py-3 rounded-full hover:bg-white/10"
            >
              Ver serviços
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== SERVIÇOS ===================== */}
      <section className="space-y-8">
        <h2 className="text-3xl font-semibold">Serviços Profissionais</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Elétrica Automotiva",
              desc: "Alternador, motor de partida, curto, scanner.",
              icon: "🔧",
            },
            {
              title: "Som & Multimídia",
              desc: "Centrais premium, módulo, sub, instalação limpa.",
              icon: "🔊",
            },
            {
              title: "LED & Iluminação",
              desc: "Super LED, farol, DRL, milha.",
              icon: "💡",
            },
            {
              title: "Segurança",
              desc: "Alarme, trava elétrica, bloqueador.",
              icon: "🔐",
            },
            {
              title: "Acessórios",
              desc: "Antenas, câmera de ré, sensores.",
              icon: "📡",
            },
            {
              title: "Projetos Personalizados",
              desc: "Montagens exclusivas com acabamento premium.",
              icon: "⚡",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 hover:border-red-700/50 transition"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="text-sm text-zinc-400 mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== ANTES E DEPOIS ===================== */}
      <section className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold">Antes e Depois</h2>
          <Link
            href="/autoeletrico/danisound/antes-depois"
            className="text-red-500 hover:underline"
          >
            Ver todos →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* HONDA */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Instalação de Multimídia (Honda)</h4>
            <div className="grid grid-cols-2 gap-3">
              <Image
                src="/danisound/antes-honda.jpg"
                width={600}
                height={500}
                alt="Antes Honda"
                className="rounded-xl object-cover"
              />
              <Image
                src="/danisound/depois-honda.jpg"
                width={600}
                height={500}
                alt="Depois Honda"
                className="rounded-xl object-cover"
              />
            </div>
          </div>

          {/* KIA */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Multimídia Tela Grande (Kia)</h4>
            <div className="grid grid-cols-2 gap-3">
              <Image
                src="/danisound/antes-kia.jpg"
                width={600}
                height={500}
                alt="Antes Kia"
                className="rounded-xl object-cover"
              />
              <Image
                src="/danisound/depois-kia.jpg"
                width={600}
                height={500}
                alt="Depois Kia"
                className="rounded-xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===================== PRODUTOS ===================== */}
      <section className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold">Produtos & Instalação</h2>
          <Link
            href="/autoeletrico/danisound/produtos"
            className="text-red-500 hover:underline"
          >
            Ver catálogo completo →
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            { img: "led-s14.jpg", name: "Super LED S14" },
            { img: "antena-lookout.jpg", name: "Antena Interna Look-Out" },
            { img: "falante-hurricane.jpg", name: "Hurricane 65W RMS" },
            { img: "alarme.jpg", name: "Alarme Automotivo" },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 hover:border-red-700/50 transition"
            >
              <Image
                src={`/danisound/${item.img}`}
                width={400}
                height={300}
                alt={item.name}
                className="rounded-lg object-contain mx-auto"
              />
              <h4 className="text-center text-sm font-semibold mt-3">{item.name}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== FOTO FACHADA ===================== */}
      <section className="rounded-2xl overflow-hidden border border-red-900/40 shadow-lg">
        <Image
          src="/danisound/loja-dia.jpg"
          alt="Loja Dani Sound"
          width={1400}
          height={800}
          className="object-cover w-full"
        />
      </section>

    </div>
  );
}
