import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default async function ProcessosPage() {
  const { data: processos, error } = await supabase
    .from("jurisos_processos")
    .select("*, jurisos_clientes(nome)")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="min-h-screen bg-slate-100 p-8">Erro ao carregar processos: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Processos</h1>
          <p className="text-slate-500">Controle processual do escritório.</p>
        </div>
        <Link href="/jurisos/processos/novo" className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
          Novo Processo
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="p-4 text-left">Número CNJ</th>
              <th className="p-4 text-left">Cliente</th>
              <th className="p-4 text-left">Área</th>
              <th className="p-4 text-left">Tribunal</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {processos?.map((processo: any) => (
              <tr key={processo.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-semibold">{processo.numero_cnj}</td>
                <td className="p-4">{processo.jurisos_clientes?.nome || "-"}</td>
                <td className="p-4">{processo.area || "-"}</td>
                <td className="p-4">{processo.tribunal || "-"}</td>
                <td className="p-4">{processo.status || "-"}</td>
                <td className="p-4 text-right">
                  <Link href={`/jurisos/processos/${processo.id}`} className="font-semibold text-blue-600">Abrir</Link>
                </td>
              </tr>
            ))}
            {processos?.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">Nenhum processo cadastrado ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
