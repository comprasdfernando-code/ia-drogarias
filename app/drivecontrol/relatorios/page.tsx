import DriverControlShell from "../_components/DriverControlShell";

export default function RelatoriosPage() {
  return (
    <DriverControlShell>
      <h2 className="mb-4 text-2xl font-bold">Relatórios</h2>

      <div className="rounded-2xl bg-slate-900 p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <input className="rounded-xl bg-slate-800 p-3" type="date" />
          <input className="rounded-xl bg-slate-800 p-3" type="date" />
          <select className="rounded-xl bg-slate-800 p-3">
            <option>Todos aplicativos</option>
            <option>Uber</option>
            <option>99</option>
            <option>Indrive</option>
            <option>Particular</option>
          </select>
          <button className="rounded-xl bg-blue-600 p-3 font-bold">
            Buscar
          </button>
        </div>

        <div className="mt-6 text-slate-400">
          Resultado dos relatórios vai aparecer aqui.
        </div>
      </div>
    </DriverControlShell>
  );
}