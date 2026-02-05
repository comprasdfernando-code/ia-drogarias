// app/fisiocaresapopemba/page.tsx
import Link from "next/link";

function Card({
  title,
  desc,
  href,
  badge,
}: {
  title: string;
  desc: string;
  href: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {badge ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
      <div className="mt-4 text-sm font-semibold text-slate-900">Abrir →</div>
    </Link>
  );
}

export default function FisioCareSapopembaHome() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="mx-auto max-w-6xl px-6 pt-8 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              FisioCarePet Sapopemba • Painel
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Central de organização: implantação (obra/pós) e financeiro (receitas).
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
            <div className="text-xs font-medium text-slate-500">Acesso rápido</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              Implantação • Receitas
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 pb-10 md:grid-cols-2 lg:grid-cols-3">
        <Card
          title="Receitas (Financeiro)"
          desc="Registrar entradas com data, paciente/tutor/serviço, forma de pagamento, status e total do período."
          href="/fisiocarepet/sapopemba/receita"
          badge="NOVO"
        />

        <Card
          title="Implantação (Obra + Pós-abertura)"
          desc="Mantido como está. Página usada para organizar investimentos da construção e fase pós-abertura."
          href="/fisiocarepet/sapopemba/implantacao"
          badge="MANTER"
        />
      </section>
    </main>
  );
}
