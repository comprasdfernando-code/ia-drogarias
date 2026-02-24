// app/planilhadigital/temp/layout.tsx
import Link from "next/link";
import { LojaProvider } from "./_components/LojaProvider";
import LojaSelectTop from "./_components/LojaSelectTop";

export default function TempLayout({ children }: { children: React.ReactNode }) {
  return (
    <LojaProvider>
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r p-4">
              <div>
                <div className="text-sm font-semibold opacity-70">IA Drogarias</div>
                <div className="text-lg font-bold">Planilha Digital</div>
                <div className="text-sm opacity-70">Controle de Temperatura</div>
              </div>

              <nav className="mt-4 grid gap-2">
                <Link href="/planilhadigital/temp" className="rounded border px-3 py-2 text-sm hover:bg-black/5">
                  Dashboard
                </Link>
                <Link href="/planilhadigital/temp/registro" className="rounded border px-3 py-2 text-sm hover:bg-black/5">
                  Registrar Leitura
                </Link>
                <Link href="/planilhadigital/temp/alertas" className="rounded border px-3 py-2 text-sm hover:bg-black/5">
                  Alertas
                </Link>
                <Link href="/planilhadigital/temp/config" className="rounded border px-3 py-2 text-sm hover:bg-black/5">
                  Configuração
                </Link>
              </nav>

              <div className="mt-4 rounded border p-3 text-xs opacity-80">
                <div className="font-semibold mb-1">Em breve</div>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Relatório PDF (Vigilância)</li>
                  <li>Alertas WhatsApp</li>
                </ul>
              </div>
            </aside>

            {/* Content */}
            <main className="flex-1 p-2 md:p-6">
              <LojaSelectTop />
              {children}
            </main>
          </div>
        </div>
      </div>
    </LojaProvider>
  );
}