import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { criarMovimentacao, excluirProcesso } from "../actions";
import ProcessoInfo, { Info } from "../components/ProcessoInfo";
import MovimentacaoForm from "../components/MovimentacaoForm";
import ProcessoTimeline from "../components/ProcessoTimeline";

export default async function ProcessoPerfilPage({ params }: { params: { id: string } }) {
  const { data: processo } = await supabase
    .from("jurisos_processos")
    .select("*, jurisos_clientes(id, nome, telefone, email, whatsapp)")
    .eq("id", params.id)
    .single();

  if (!processo) notFound();

  const { data: movimentacoes } = await supabase
    .from("jurisos_movimentacoes")
    .select("*")
    .eq("processo_id", params.id)
    .order("data_movimentacao", { ascending: false });

  const salvarMovimentacao = criarMovimentacao.bind(null, processo.id);
  const deletarProcesso = excluirProcesso.bind(null, processo.id);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/jurisos/processos" className="text-blue-600">← Voltar para processos</Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{processo.numero_cnj}</h1>
          <p className="text-slate-500">Cliente: {processo.jurisos_clientes?.nome || "Não vinculado"}</p>
        </div>

        <div className="flex gap-3">
          <Link href={`/jurisos/processos/${processo.id}/editar`} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
            Editar
          </Link>
          <form action={deletarProcesso}>
            <button className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700">Excluir</button>
          </form>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <ProcessoInfo processo={processo} />

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Cliente</h2>
          <div className="mt-5 space-y-3">
            <Info label="Nome" value={processo.jurisos_clientes?.nome} />
            <Info label="Telefone" value={processo.jurisos_clientes?.telefone} />
            <Info label="WhatsApp" value={processo.jurisos_clientes?.whatsapp} />
            <Info label="E-mail" value={processo.jurisos_clientes?.email} />
            {processo.jurisos_clientes?.id && (
              <Link href={`/jurisos/clientes/${processo.jurisos_clientes.id}`} className="mt-4 inline-block font-semibold text-blue-600">Abrir cliente</Link>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-3">
          <h2 className="text-xl font-bold text-slate-900">JurisIA - resumo inicial</h2>
          <p className="mt-3 text-slate-600">
            Área: {processo.area || "não informada"}. Status atual: {processo.status || "não informado"}. Use as movimentações abaixo para manter a linha do tempo do caso organizada.
          </p>
        </section>

        <MovimentacaoForm action={salvarMovimentacao} />
        <ProcessoTimeline processoId={processo.id} movimentacoes={movimentacoes} />
      </div>
    </div>
  );
}
