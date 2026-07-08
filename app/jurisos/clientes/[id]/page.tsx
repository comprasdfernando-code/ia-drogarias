import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { excluirCliente } from "../actions";

export default async function ClientePerfilPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: cliente } = await supabase
    .from("jurisos_clientes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!cliente) notFound();

  const deletar = excluirCliente.bind(null, cliente.id);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/jurisos/clientes" className="text-blue-600">
            ← Voltar
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            {cliente.nome}
          </h1>
          <p className="text-slate-500">Perfil completo do cliente.</p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/jurisos/clientes/${cliente.id}/editar`}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            Editar
          </Link>

          <form action={deletar}>
            <button className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white">
              Excluir
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900">Dados principais</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Info label="CPF" value={cliente.cpf} />
            <Info label="CNPJ" value={cliente.cnpj} />
            <Info label="Telefone" value={cliente.telefone} />
            <Info label="WhatsApp" value={cliente.whatsapp} />
            <Info label="E-mail" value={cliente.email} />
            <Info label="Status" value={cliente.status} />
            <Info label="Profissão" value={cliente.profissao} />
            <Info label="Empresa" value={cliente.empresa} />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Endereço</h2>

          <div className="mt-5 space-y-3">
            <Info label="CEP" value={cliente.cep} />
            <Info label="Logradouro" value={cliente.logradouro} />
            <Info label="Número" value={cliente.numero} />
            <Info label="Bairro" value={cliente.bairro} />
            <Info label="Cidade" value={cliente.cidade} />
            <Info label="Estado" value={cliente.estado} />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-3">
          <h2 className="text-xl font-bold text-slate-900">Observações</h2>
          <p className="mt-3 text-slate-600">
            {cliente.observacoes || "Nenhuma observação cadastrada."}
          </p>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800">{value || "-"}</p>
    </div>
  );
}