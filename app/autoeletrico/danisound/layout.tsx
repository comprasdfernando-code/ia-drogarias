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
    <html lang="pt-BR">
      <body>


        {/* HEADER PREMIUM */}
        <header className="backdrop-blur-xl bg-black/70 border-b border-red-800/40 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

            {/* LOGO */}
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <Image
                  src="/danisound/logo.png"
                  alt="Logo Dani Sound"
                  fill
                  className="object-contain drop-shadow-[0_0_20px_rgba(255,0,0,0.6)]"
                />
              </div>
              <div className="leading-tight">
                <p className="text-xl font-bold text-red-500 drop-shadow-lg">
                  Dani Sound
                </p>
                <p className="text-xs text-zinc-400">Auto Elétrico • Som • LED</p>
              </div>
            </div>

            <nav className="hidden md:flex gap-6 text-sm">
              <Link href="/autoeletrico/danisound" className="hover:text-red-400">
                Início
              </Link>
              <Link href="/autoeletrico/danisound/servicos" className="hover:text-red-400">
                Serviços
              </Link>
              <Link href="/autoeletrico/danisound/produtos" className="hover:text-red-400">
                Produtos
              </Link>
              <Link href="/autoeletrico/danisound/antes-depois" className="hover:text-red-400">
                Antes e Depois
              </Link>
              <Link href="/autoeletrico/danisound/galeria" className="hover:text-red-400">
                Galeria
              </Link>
              <Link href="/autoeletrico/danisound/orcamento" className="hover:text-red-400">
                Orçamento
              </Link>
            </nav>

            {/* BOTÃO WHATSAPP */}
            <a
              href="https://wa.me/5511977844066?text=Olá,+quero+um+orçamento!"
              target="_blank"
              className="bg-red-600 hover:bg-red-700 px-4 py-2 text-sm rounded-full shadow-lg shadow-red-700/50"
            >
              WhatsApp
            </a>
          </div>
        </header>

        <main>{children}</main>

        {/* RODAPÉ */}
        <footer className="border-t border-red-900/40 bg-black mt-16">
          <div className="max-w-6xl mx-auto px-4 py-6 text-xs text-zinc-500 flex justify-between">
            <span>© {new Date().getFullYear()} Dani Sound - Auto Elétrico e Som</span>
            <span>Desenvolvido por Fer + IA 💙⚡</span>
          </div>
        </footer>

        {/* BOTÃO WHATSAPP FIXO */}
        <a
          href="https://wa.me/5511977844066?text=Olá,+quero+um+orçamento!"
          target="_blank"
          className="fixed bottom-5 right-5 bg-green-500 shadow-xl shadow-green-600/40 hover:bg-green-600 px-5 py-3 rounded-full font-bold"
        >
          WhatsApp
        </a>

      </body>
    </html>
  );
}
