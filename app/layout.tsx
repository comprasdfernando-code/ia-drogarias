import "./globals.css";
import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import Link from "next/link"; // ✅ adiciona o Link do Next.js

export const metadata: Metadata = {
  title: "IA Drogarias",
  description: "Saúde com Inteligência 💊",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-100 text-gray-900">
        {/* Header fixo */}
        <header className="bg-blue-700 text-white py-4 shadow-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center px-6">
            {/* Logo + Nome com link */}
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-90 transition"
            >
              <img
                src="/logo-ia.png"
                alt="IA Drogarias"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="font-bold text-lg leading-tight">IA Drogarias</h1>
                <p className="text-xs text-blue-100 -mt-1">
                  Saúde com Inteligência
                </p>
              </div>
            </Link>

            {/* Navegação */}
            <nav className="flex items-center gap-4">
              <a
                href="/"
                className="bg-white text-blue-700 px-3 py-1 rounded-md font-semibold hover:bg-gray-200 transition"
              >
                E-commerce
              </a>
              <a
                href="/servicos"
                className="bg-white text-blue-700 px-3 py-1 rounded-md font-semibold hover:bg-gray-200 transition"
              >
                Serviços
              </a>
              <ShoppingCart className="w-6 h-6 text-white cursor-pointer hover:text-blue-200" />
              <a
                href="/login"
                className="bg-white text-blue-700 px-3 py-1 rounded-md font-semibold hover:bg-gray-200 transition"
              >
                Entrar / Cadastrar
              </a>
            </nav>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="min-h-screen">{children}</main>

        {/* Rodapé */}
        <footer className="bg-blue-700 text-white py-3 text-center text-sm mt-10">
          © {new Date().getFullYear()} IA Drogarias - Todos os direitos reservados
        </footer>
      </body>
    </html>
  );
}
