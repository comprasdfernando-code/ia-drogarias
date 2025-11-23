export const dynamic = "force-static";

import "./styles.css";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Dani Sound - Auto Elétrico & Som Automotivo",
  description:
    "Auto elétrico, multimídia, LED, alarme, bloqueador, travas elétricas e som automotivo profissional na Av. Rodolfo Pirani.",
};

export default function DaniSoundLayout({ children }) {
  return (
    <div
  className="min-h-screen text-white"
  style={{
    backgroundImage: 'url("/danisound/bg-neon.jpg")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  }}
>

      {/* HEADER PREMIUM */}
      <header className="backdrop-blur-xl bg-black/70 border-b border-red-800/40 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16">
              <Image
                src="/danisound/logo.png"
                alt="Logo Dani Sound"
                fill
                className="object-contain drop-shadow-[0_0_20px_rgba(255,0,0,0.6)]"
              />
            </div>
            <h1 className="text-lg font-bold">Dani Sound</h1>
          </div>

          {/* Menu */}
          <nav className="hidden md:flex gap-6 text-sm">
            <Link href="/autoeletrico/danisound">Início</Link>
            <Link href="/autoeletrico/danisound/servicos">Serviços</Link>
            <Link href="/autoeletrico/danisound/produtos">Produtos</Link>
            <Link href="/autoeletrico/danisound/antes-depois">Antes e Depois</Link>
            <Link href="/autoeletrico/danisound/galeria">Galeria</Link>
            <Link href="/autoeletrico/danisound/orcamento">Orçamento</Link>
          </nav>

          {/* Botão WhatsApp */}
          <a
            href="https://wa.me/5511977844066?text=Olá,+quero+um+orçamento!"
            target="_blank"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full shadow-lg shadow-red-900/40"
          >
            WhatsApp
          </a>
        </div>
      </header>

      {/* CONTEÚDO DAS PÁGINAS */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="text-center text-sm py-10 opacity-70">
        <span>
          © {new Date().getFullYear()} Dani Sound – Desenvolvido com IA ❤️⚡
        </span>
      </footer>

      {/* BOTÃO FLUTUANTE WHATSAPP */}
      <a
        href="https://wa.me/5511977844066?text=Olá,+quero+um+orçamento!"
        target="_blank"
        className="fixed bottom-5 right-5 bg-green-500 shadow-xl shadow-green-600/40 hover:bg-green-600 px-5 py-3 rounded-full font-bold"
      >
        WhatsApp
      </a>
    </div>
  );
}
