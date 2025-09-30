import "./globals.css";
import type { Metadata } from "next";

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
        {/* Header fixo no topo */}
        <header className="bg-blue-600 text-white p-4 shadow flex justify-between items-center">
          {/* Logo + Nome */}
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="IA Drogarias" className="h-8" />
            <span className="font-bold text-lg">IA Drogarias</span>
          </div>

          {/* Menu */}
          <nav className="space-x-4">
            <a
              href="/servicos"
              className="bg-white text-blue-600 px-3 py-1 rounded shadow hover:bg-gray-100"
            >
              Serviços
            </a>
            <a
              href="/farmacia"
              className="bg-white text-blue-600 px-3 py-1 rounded shadow hover:bg-gray-100"
            >
              Farmácia Virtual
            </a>
          </nav>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-grow p-6">{children}</main>

        {/* Rodapé */}
        <footer className="bg-gray-800 text-white text-center p-4 mt-10">
          <p>© 2025 IA Drogarias - Todos os direitos reservados</p>
        </footer>
      </body>
    </html>
  );
}
