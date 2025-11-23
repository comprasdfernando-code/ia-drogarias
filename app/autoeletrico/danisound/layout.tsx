// app/autoeletrico/danisound/layout.tsx
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Dani Sound - Auto Elétrico & Som Automotivo",
  description: "Som, elétrica, LED, acessórios e soluções automotivas.",
};

export default function DaniSoundLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-black text-zinc-50">

      <header className="border-b border-red-900/40 bg-black/90 backdrop-blur sticky top-0 z-50 shadow-red-600/20 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">

          {/* LOGO OFICIAL */}
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14">
              <Image
                src="/danisound/logo.png"
                alt="Logo Dani Sound"
                fill
                className="object-contain drop-shadow-[0_0_12px_rgba(255,0,0,0.6)]"
              />
            </div>

            <div className="leading-tight">
              <p className="text-lg font-bold tracking-wide text-red-500">Dani Sound</p>
              <p className="text-[11px] text-zinc-400">Auto Elétrico • Som • LED</p>
            </div>
          </div>

          <nav className="hidden sm:flex gap-4 text-sm">
            <Link href="/autoeletrico/danisound" className="hover:text-red-400 transition">Início</Link>
            <Link href="/autoeletrico/danisound/servicos" className="hover:text-red-400 transition">Serviços</Link>
            <Link href="/autoeletrico/danisound/galeria" className="hover:text-red-400 transition">Galeria</Link>
            <Link href="/autoeletrico/danisound/orcamento" className="hover:text-red-400 transition">Orçamento</Link>
          </nav>

          <a
            href="https://wa.me/5511977844066?text=Olá,+gostaria+de+um+orçamento!"
            target="_blank"
            className="hidden sm:inline-flex bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full text-xs font-semibold"
          >
            WhatsApp
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-red-900/40 bg-black/90 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-zinc-400 flex justify-between">
          <span>© {new Date().getFullYear()} Dani Sound</span>
          <span>Site por Fer + IA 💙⚡</span>
        </div>
      </footer>

    </div>
  );
}
