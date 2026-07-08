export default function ProcessoInfo({ processo }: { processo: any }) {
  const valor = processo.valor ? Number(processo.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-";

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
      <h2 className="text-xl font-bold text-slate-900">Dados do processo</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Info label="Área" value={processo.area} />
        <Info label="Tribunal" value={processo.tribunal} />
        <Info label="Vara" value={processo.vara} />
        <Info label="Comarca" value={processo.comarca} />
        <Info label="Fase" value={processo.fase} />
        <Info label="Status" value={processo.status} />
        <Info label="Responsável" value={processo.responsavel} />
        <Info label="Valor" value={valor} />
      </div>
      <div className="mt-6">
        <Info label="Descrição" value={processo.descricao} />
      </div>
    </section>
  );
}

export function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800">{value || "-"}</p>
    </div>
  );
}
