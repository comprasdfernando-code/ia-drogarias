import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default async function ClientesPage() {
  const { data: clientes } = await supabase
    .from("jurisos_clientes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500">Clientes cadastrados no escritório.</p>
        </div>

        <Link href="/jurisos/clientes/novo" className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">
          Novo Cliente
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="p-4 text-left">Nome</th>
              <th className="p-4 text-left">Telefone</th>
              <th className="p-4 text-left">E-mail</th>
              <th className="p-4 text-left">Cidade</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>

          <tbody>
            {clientes?.map((cliente) => (
              <tr key={cliente.id} className="border-b">
                <td className="p-4 font-semibold">{cliente.nome}</td>
                <td className="p-4">{cliente.telefone}</td>
                <td className="p-4">{cliente.email}</td>
                <td className="p-4">{cliente.cidade}</td>
                <td className="p-4">{cliente.status}</td>
                <td className="p-4 text-right">
                  <Link href={`/jurisos/clientes/${cliente.id}`} className="text-blue-600 font-semibold">
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}

            {clientes?.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Nenhum cliente cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}