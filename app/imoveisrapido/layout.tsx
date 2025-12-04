// app/imoveisrapido/layout.tsx
import "../globals.css";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "IMOVEIS RÁPIDO – Encontre seu imóvel rápido e fácil",
  description: "Plataforma de anúncios imobiliários rápida e moderna.",
};



export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* HEADER */}
      <header className="w-full bg-white shadow-md py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/imoveisrapido/logo.png"
              alt="Logo Imoveis Rapido"
              width={48}
              height={48}
            />
            <span className="text-2xl font-bold text-blue-700">IMOVEIS RÁPIDO</span>
          </div>

          <nav className="flex gap-6 text-lg font-medium">
            <Link href="/imoveisrapido" className="hover:text-blue-600">
              Início
            </Link>
            <Link href="/imoveisrapido/imovel/1" className="hover:text-blue-600">
              Imóveis
            </Link>
            <Link href="/imoveisrapido/anunciar" className="hover:text-blue-600">
              Anunciar
            </Link>
            <Link href="/imoveisrapido/corretores" className="hover:text-blue-600">
              Corretores
            </Link>
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1">{children}</main>

      {/* FOOTER */}
      <footer className="bg-blue-900 text-white mt-16 py-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">

          <div>
            <h3 className="text-xl font-bold mb-3">IMOVEIS RÁPIDO</h3>
            <p className="text-gray-200">
              O jeito mais rápido de conectar compradores, vendedores e corretores.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">Links úteis</h4>
            <ul className="space-y-2 text-gray-200">
              <li><Link href="/imoveisrapido" className="hover:text-white">Início</Link></li>
              <li><Link href="#" className="hover:text-white">Anunciar imóvel</Link></li>
              <li><Link href="#" className="hover:text-white">Imóveis disponíveis</Link></li>
              <li><Link href="#" className="hover:text-white">Corretores</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">Aviso Legal</h4>
            <p className="text-gray-200 text-sm">
              A plataforma IMOVEIS RÁPIDO atua apenas como serviço de anúncios.
              Não realiza corretagem imobiliária ou intermediação de contratos.
            </p>
          </div>
        </div>

        <div className="text-center text-gray-300 mt-6">
          © {new Date().getFullYear()} IMOVEIS RÁPIDO — Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
