// components/SiteFooter.tsx
export default function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-extrabold">
            NINHO <span className="text-yellow-400">CAR</span>
          </div>
          <div className="text-xs text-zinc-400">
            Auto Elétrica • Som • Acessórios • Conveniência
          </div>
        </div>

        <div className="mt-6 text-xs text-zinc-500">
          © {new Date().getFullYear()} Ninho Car. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
