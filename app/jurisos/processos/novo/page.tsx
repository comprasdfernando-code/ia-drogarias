import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { criarProcesso } from "../actions";
import ProcessoForm from "../components/ProcessoForm";

export default async function NovoProcessoPage() {
  const { data: clientes } = await supabase
    .from("jurisos_clientes")
    .select("id, nome")
    .order("nome", { ascending: true });

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <Link href="/jurisos/processos" className="text-blue-600">← Voltar</Link>
      <h1 className="mt-3 text-3xl font-bold text-slate-900">Novo Processo</h1>
      <p className="text-slate-500">Cadastre um processo vinculado a um cliente.</p>
      <ProcessoForm action={criarProcesso} clientes={clientes} buttonLabel="Salvar Processo" />
    </div>
  );
}
