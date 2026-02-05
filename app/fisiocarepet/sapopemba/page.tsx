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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              FisioCarePet Sapopemba • Painel
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Central do projeto: implantação, receitas e recebíveis com cálculo automático de comissão.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Atalhos</div>
            <div className="mt-1 flex flex-wrap gap-2">
              <Link
                href="/fisiocaresapopemba/implantacao"
                className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-100"
              >
                Implantação
              </Link>
              <Link
                href="/fisiocaresapopemba/receita"
                className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-100"
              >
                Receitas
              </Link>
              <Link
                href="/fisiocaresapopemba/recebiveis"
                className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-100"
              >
                Recebíveis
              </Link>
              <Link
                href="/fisiocaresapopemba/profissionais"
                className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-100"
              >
                Veterinárias
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 pb-10 md:grid-cols-2 lg:grid-cols-2">
        <Card
          title="Recebíveis • Comissão Automática"
          desc="Lança atendimentos por veterinária e calcula: cartão -2,79% → imposto -6% (em tudo) → comissão 28%. Cancelado zera comissão."
          href="/fisiocarepet/sapopemba/recebiveis"
          badge="PRINCIPAL"
        />

        <Card
          title="Veterinárias • Cadastro"
          desc="Cadastre a profissional (nome, CRMV, chave PIX). Vira opção no lançamento dos recebíveis e no fechamento mensal."
          href="/fisiocarepet/sapopemba/profissionais"
          badge="CADASTRO"
        />

        <Card
          title="Receitas (Financeiro simples)"
          desc="Controle de entradas em formato planilha: data, serviço, forma, status e totais do período."
          href="/fisiocarepet/sapopemba/receita"
          badge="PLANILHA"
        />

        <Card
          title="Implantação (Obra + Pós-abertura)"
          desc="Sua página atual mantida: controle de itens, entrada, parcelas, saldo restante e totais."
          href="/fisiocarepet/sapopemba/implantacao"
          badge="MANTER"
        />
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-slate-500">
        Dica: o fechamento do mês sai na tela de Recebíveis (A pagar por veterinária). Cancelado não entra.
      </footer>
    </main>
  );
}
