import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { atualizarCliente } from "../../actions";

export default async function EditarClientePage({
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

  const salvar = atualizarCliente.bind(null, cliente.id);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Editar Cliente</h1>

      <form action={salvar} className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <input name="nome" defaultValue={cliente.nome} required className="rounded-xl border p-3" />
          <input name="cpf" defaultValue={cliente.cpf || ""} placeholder="CPF" className="rounded-xl border p-3" />
          <input name="cnpj" defaultValue={cliente.cnpj || ""} placeholder="CNPJ" className="rounded-xl border p-3" />
          <input name="telefone" defaultValue={cliente.telefone || ""} placeholder="Telefone" className="rounded-xl border p-3" />
          <input name="whatsapp" defaultValue={cliente.whatsapp || ""} placeholder="WhatsApp" className="rounded-xl border p-3" />
          <input name="email" defaultValue={cliente.email || ""} placeholder="E-mail" className="rounded-xl border p-3" />
          <input name="cep" defaultValue={cliente.cep || ""} placeholder="CEP" className="rounded-xl border p-3" />
          <input name="logradouro" defaultValue={cliente.logradouro || ""} placeholder="Endereço" className="rounded-xl border p-3" />
          <input name="numero" defaultValue={cliente.numero || ""} placeholder="Número" className="rounded-xl border p-3" />
          <input name="bairro" defaultValue={cliente.bairro || ""} placeholder="Bairro" className="rounded-xl border p-3" />
          <input name="cidade" defaultValue={cliente.cidade || ""} placeholder="Cidade" className="rounded-xl border p-3" />
          <input name="estado" defaultValue={cliente.estado || ""} placeholder="Estado" className="rounded-xl border p-3" />
          <input name="profissao" defaultValue={cliente.profissao || ""} placeholder="Profissão" className="rounded-xl border p-3" />
          <input name="empresa" defaultValue={cliente.empresa || ""} placeholder="Empresa" className="rounded-xl border p-3" />

          <select name="status" defaultValue={cliente.status || "Ativo"} className="rounded-xl border p-3">
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
            <option value="Aguardando documentos">Aguardando documentos</option>
          </select>

          <textarea
            name="observacoes"
            defaultValue={cliente.observacoes || ""}
            placeholder="Observações"
            className="rounded-xl border p-3 md:col-span-2"
            rows={4}
          />
        </div>

        <button className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white">
          Salvar Alterações
        </button>
      </form>
    </div>
  );
}