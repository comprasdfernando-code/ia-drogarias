import { excluirMovimentacao } from "../actions";

export default function MovimentacaoList({ processoId, movimentacoes }: { processoId: string; movimentacoes: any[] | null }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-3">
      <h2 className="text-xl font-bold text-slate-900">Linha do tempo</h2>
      <div className="mt-6 space-y-4">
        {movimentacoes?.map((mov) => {
          const deletar = excluirMovimentacao.bind(null, processoId, mov.id);
          return (
            <div key={mov.id} className="rounded-2xl border bg-slate-50 p-5">
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900">{mov.titulo}</h3>
                  <p className="text-sm text-slate-500">{mov.tipo || "Movimentação"}</p>
                </div>
                <span className="text-sm text-slate-500">
                  {mov.data_movimentacao ? new Date(mov.data_movimentacao + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                </span>
              </div>
              <p className="mt-3 text-slate-600">{mov.descricao || "Sem descrição."}</p>
              {mov.arquivo && <p className="mt-2 text-sm text-blue-600">Arquivo: {mov.arquivo}</p>}
              <form action={deletar} className="mt-3">
                <button className="text-sm font-semibold text-red-600">Excluir movimentação</button>
              </form>
            </div>
          );
        })}
        {(!movimentacoes || movimentacoes.length === 0) && <p className="text-slate-500">Nenhuma movimentação cadastrada.</p>}
      </div>
    </section>
  );
}
