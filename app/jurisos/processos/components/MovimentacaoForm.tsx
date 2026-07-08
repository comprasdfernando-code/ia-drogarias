export default function MovimentacaoForm({ action }: { action: (formData: FormData) => void }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-3">
      <h2 className="text-xl font-bold text-slate-900">Nova movimentação</h2>
      <form action={action} className="mt-5 grid gap-4 md:grid-cols-4">
        <input name="titulo" required placeholder="Título" className="rounded-xl border p-3" />
        <input name="tipo" placeholder="Tipo" className="rounded-xl border p-3" />
        <input name="data_movimentacao" type="date" className="rounded-xl border p-3" />
        <button className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Adicionar</button>
        <input name="arquivo" placeholder="Link do arquivo" className="rounded-xl border p-3 md:col-span-4" />
        <textarea name="descricao" placeholder="Descrição" className="rounded-xl border p-3 md:col-span-4" rows={3} />
      </form>
    </section>
  );
}
