// app/jurisos/processos/page.tsx

import { processos } from "../data/mock";

export default function ProcessosPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Processos</h1>
      <p className="mt-2 text-slate-500">Controle dos processos do escritório.</p>

      <div className="mt-8 grid gap-4">
        {processos.map((processo) => (
          <div key={processo.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">{processo.numero}</h2>
            <p className="text-slate-600">Cliente: {processo.cliente}</p>
            <p className="text-slate-600">Área: {processo.area}</p>
            <p className="text-slate-600">Status: {processo.status}</p>
            <p className="mt-3 font-semibold text-red-600">Prazo: {processo.prazo}</p>
          </div>
        ))}
      </div>
    </div>
  );
}