// /app/fotografos/stephanyvital/layout.tsx
"use client";

import "./globals.css";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/fotografos/stephanyvital" },
    { label: "Sobre", href: "/fotografos/stephanyvital/sobre" },
    { label: "Portfólio", href: "/fotografos/stephanyvital/portfolio" },
    { label: "Serviços", href: "/fotografos/stephanyvital/servicos" },
    { label: "Depoimentos", href: "/fotografos/stephanyvital/depoimentos" },
    { label: "Contato", href: "/fotografos/stephanyvital/contato" },
  ];

  return (
    <html lang="pt-BR">
      <body className="bg-[#FFF9F7] text-[#1C1C1C]">
        
        {/* ===== HEADER ===== */}
        <header className="w-full py-6 shadow-sm bg-white/80 backdrop-blur-xl fixed top-0 z-50">
          <nav className="max-w-5xl mx-auto flex items-center justify-between px-4">
            
            <Link href="/fotografos/stephanyvital">
              <h1 className="text-2xl font-semibold tracking-wide text-[#C8A49B]">
                Stephany Vital Fotografia
              </h1>
            </Link>

            <div className="flex gap-6 text-sm font-medium">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`hover:text-[#C8A49B] transition ${
                    pathname === item.href ? "text-[#C8A49B]" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>

        {/* ESPAÇO PARA NÃO SUBIR NO HEADER */}
        <div className="pt-28" />

        {/* ===== CONTEÚDO PRINCIPAL ===== */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="min-h-screen"
        >
          {children}
        </motion.main>

        {/* ===== FOOTER ===== */}
        <footer className="bg-white mt-20 py-10 border-t">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <p className="text-[#C8A49B] font-semibold text-lg">
              Stephany Vital Fotografia
            </p>
            <p className="text-sm text-gray-600 mt-2">
              © {new Date().getFullYear()} Todos os direitos reservados.
            </p>

            <p className="text-xs text-gray-400 mt-4">
              Desenvolvido por Tech Fernando Pereira — IA Drogarias
            </p>
          </div>
        </footer>

      </body>
    </html>
  );
}
