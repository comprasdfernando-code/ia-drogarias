import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { atualizarProcesso } from "../../actions";
import ProcessoForm from "../../components/ProcessoForm";

export default async function EditarProcessoPage({ params }: { params: { id: string } }) {
  const { data: processo } = await supabase
    .from("jurisos_processos")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!processo) notFound();

  const { data: clientes } = await supabase
    .from("jurisos_clientes")
    .select("id, nome")
    .order("nome", { ascending: true });

  const salvar = atualizarProcesso.bind(null, processo.id);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <Link href={`/jurisos/processos/${processo.id}`} className="text-blue-600">← Voltar</Link>
      <h1 className="mt-3 text-3xl font-bold text-slate-900">Editar Processo</h1>
      <p className="text-slate-500">Atualize os dados do processo.</p>
      <ProcessoForm action={salvar} clientes={clientes} processo={processo} buttonLabel="Salvar Alterações" />
    </div>
  );
}
