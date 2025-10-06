import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "IA Drogarias",
  description: "Marketplace de farmácias",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>IA Drogarias</title>
      </head>
      <body className="bg-gray-100 text-gray-900 min-h-screen flex flex-col">
        {/* Header responsivo (faixa azul) */}
        <header className="sticky top-0 z-50 bg-blue-600 text-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Logo + Nome */}
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <img src="/logo.png" alt="IA Drogarias" className="h-8 sm:h-10" />
              <span className="font-bold text-lg sm:text-xl">IA Drogarias</span>
            </div>

            {/* Menu (empilhado no mobile, lado a lado no desktop) */}
            <nav className="flex justify-center flex-wrap gap-3">
              <Link
                href="/servicos"
                className="bg-white text-blue-700 px-4 py-2 rounded-lg shadow hover:bg-gray-100 text-sm sm:text-base transition"
              >
                Serviços
              </Link>

              <Link
                href="/farmacia"
                className="bg-white text-blue-700 px-4 py-2 rounded-lg shadow hover:bg-gray-100 text-sm sm:text-base transition"
              >
                Farmácia Virtual
              </Link>

              {/* opcional: botão para cadastro da drogaria */}
              <Link
                href="/cadastro-drogaria"
                className="bg-white text-blue-700 px-4 py-2 rounded-lg shadow hover:bg-gray-100 text-sm sm:text-base transition"
              >
                Cadastrar Drogaria
              </Link>
            </nav>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-grow p-4 sm:p-6">{children}</main>

        {/* Rodapé */}
        <footer className="bg-gray-800 text-white text-center p-4 mt-10">
          <p>© 2025 IA Drogarias - Todos os direitos reservados</p>
        </footer>
      </body>
    </html>
  );
}
