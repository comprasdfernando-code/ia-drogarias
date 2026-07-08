// app/jurisos/clientes/page.tsx

import { clientes } from "../data/mock";

export default function ClientesPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
      <p className="mt-2 text-slate-500">Cadastro e acompanhamento dos clientes.</p>

      <div className="mt-8 grid gap-4">
        {clientes.map((cliente) => (
          <div key={cliente.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">{cliente.nome}</h2>
            <p className="text-slate-500">{cliente.telefone}</p>
            <p className="text-slate-500">{cliente.email}</p>
            <span className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
              {cliente.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}