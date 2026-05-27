import DriverControlShell from "./_components/DriverControlShell";

export default function DriverControlPage() {
  return (
    <DriverControlShell>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Faturamento mês</p>
          <h2 className="text-2xl font-bold">R$ 0,00</h2>
        </div>

        <div className="rounded-2xl bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Combustível</p>
          <h2 className="text-2xl font-bold">R$ 0,00</h2>
        </div>

        <div className="rounded-2xl bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Lucro líquido</p>
          <h2 className="text-2xl font-bold">R$ 0,00</h2>
        </div>

        <div className="rounded-2xl bg-slate-900 p-5">
          <p className="text-sm text-slate-400">KM rodado</p>
          <h2 className="text-2xl font-bold">0 km</h2>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-900 p-6">
        <h2 className="mb-2 text-lg font-bold">Funil dos dias</h2>
        <p className="text-slate-400">
          Aqui vamos mostrar dias trabalhados, dias sem lançamento, lucro baixo,
          lucro bom e prejuízo.
        </p>
      </div>
    </DriverControlShell>
  );
}