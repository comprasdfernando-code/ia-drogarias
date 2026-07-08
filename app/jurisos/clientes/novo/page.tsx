import { criarCliente } from "../actions";

export default function NovoClientePage() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Novo Cliente</h1>
      <p className="text-slate-500">Cadastre um novo cliente no JurisOS.</p>

      <form action={criarCliente} className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <input name="nome" required placeholder="Nome completo" className="rounded-xl border p-3" />
          <input name="cpf" placeholder="CPF" className="rounded-xl border p-3" />
          <input name="cnpj" placeholder="CNPJ" className="rounded-xl border p-3" />
          <input name="telefone" placeholder="Telefone" className="rounded-xl border p-3" />
          <input name="whatsapp" placeholder="WhatsApp" className="rounded-xl border p-3" />
          <input name="email" placeholder="E-mail" className="rounded-xl border p-3" />
          <input name="cep" placeholder="CEP" className="rounded-xl border p-3" />
          <input name="logradouro" placeholder="Endereço" className="rounded-xl border p-3" />
          <input name="numero" placeholder="Número" className="rounded-xl border p-3" />
          <input name="bairro" placeholder="Bairro" className="rounded-xl border p-3" />
          <input name="cidade" placeholder="Cidade" className="rounded-xl border p-3" />
          <input name="estado" placeholder="Estado" className="rounded-xl border p-3" />
          <input name="profissao" placeholder="Profissão" className="rounded-xl border p-3" />
          <input name="empresa" placeholder="Empresa" className="rounded-xl border p-3" />

          <select name="status" className="rounded-xl border p-3">
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
            <option value="Aguardando documentos">Aguardando documentos</option>
          </select>

          <textarea
            name="observacoes"
            placeholder="Observações"
            className="rounded-xl border p-3 md:col-span-2"
            rows={4}
          />
        </div>

        <button className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white">
          Salvar Cliente
        </button>
      </form>
    </div>
  );
}