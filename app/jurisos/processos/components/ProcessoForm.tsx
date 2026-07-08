type Cliente = { id: string; nome: string };
type Processo = {
  id?: string;
  cliente_id?: string | null;
  numero_cnj?: string | null;
  area?: string | null;
  tribunal?: string | null;
  vara?: string | null;
  comarca?: string | null;
  fase?: string | null;
  status?: string | null;
  valor?: number | string | null;
  descricao?: string | null;
  responsavel?: string | null;
};

export default function ProcessoForm({
  action,
  clientes,
  processo,
  buttonLabel = "Salvar Processo",
}: {
  action: (formData: FormData) => void;
  clientes: Cliente[] | null;
  processo?: Processo | null;
  buttonLabel?: string;
}) {
  return (
    <form action={action} className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <input name="numero_cnj" required defaultValue={processo?.numero_cnj || ""} placeholder="Número CNJ" className="rounded-xl border p-3" />

        <select name="cliente_id" defaultValue={processo?.cliente_id || ""} className="rounded-xl border p-3">
          <option value="">Selecione o cliente</option>
          {clientes?.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
          ))}
        </select>

        <input name="area" defaultValue={processo?.area || ""} placeholder="Área do Direito" className="rounded-xl border p-3" />
        <input name="tribunal" defaultValue={processo?.tribunal || ""} placeholder="Tribunal" className="rounded-xl border p-3" />
        <input name="vara" defaultValue={processo?.vara || ""} placeholder="Vara" className="rounded-xl border p-3" />
        <input name="comarca" defaultValue={processo?.comarca || ""} placeholder="Comarca" className="rounded-xl border p-3" />
        <input name="fase" defaultValue={processo?.fase || ""} placeholder="Fase" className="rounded-xl border p-3" />
        <input name="responsavel" defaultValue={processo?.responsavel || ""} placeholder="Responsável" className="rounded-xl border p-3" />
        <input name="valor" type="number" step="0.01" defaultValue={processo?.valor || ""} placeholder="Valor da causa" className="rounded-xl border p-3" />

        <select name="status" defaultValue={processo?.status || "Em andamento"} className="rounded-xl border p-3">
          <option value="Em andamento">Em andamento</option>
          <option value="Suspenso">Suspenso</option>
          <option value="Arquivado">Arquivado</option>
          <option value="Sentença">Sentença</option>
          <option value="Recurso">Recurso</option>
        </select>

        <textarea name="descricao" defaultValue={processo?.descricao || ""} placeholder="Descrição do caso" className="rounded-xl border p-3 md:col-span-2" rows={4} />
      </div>

      <button className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
        {buttonLabel}
      </button>
    </form>
  );
}
