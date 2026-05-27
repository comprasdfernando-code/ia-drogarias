import Link from "next/link";

export default function DriverControlShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">DriveControl</h1>
            <p className="text-sm text-slate-400">
              Controle financeiro para motoristas de app
            </p>
          </div>

          <nav className="flex gap-3 text-sm">
            <Link href="/drivercontrol">Dashboard</Link>
            <Link href="/drivecontrol/veiculos">Veículos</Link>
            <Link href="/drivecontrol/lancamentos">Lançamentos</Link>
            <Link href="/drivecontrol/relatorios">Relatórios</Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </main>
  );
}