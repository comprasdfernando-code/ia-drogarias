import MovimentacaoList from "./MovimentacaoList";

export default function ProcessoTimeline({ processoId, movimentacoes }: { processoId: string; movimentacoes: any[] | null }) {
  return <MovimentacaoList processoId={processoId} movimentacoes={movimentacoes} />;
}
