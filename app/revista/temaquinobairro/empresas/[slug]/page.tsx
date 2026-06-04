import Header from '../../components/Header';
import { empresas } from '../../components/data';

export default function EmpresaPage({ params }: { params: { slug: string } }) {
  const empresa = empresas.find((e) => e.slug === params.slug) ?? empresas[0];
  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <p className="text-sm text-slate-300">{empresa.bairro} › {empresa.categoria}</p>
          <h1 className="mt-3 text-4xl font-black">{empresa.nome}</h1>
          <p className="mt-3 max-w-2xl text-xl text-slate-200">{empresa.descricao}</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-[1fr_320px]">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-2xl font-black">Informações</h2>
          <p className="mt-4">📍 {empresa.endereco}</p>
          <p className="mt-2">☎️ {empresa.telefone}</p>
          <p className="mt-2">⭐ {empresa.avaliacao} ({empresa.totalAvaliacoes} avaliações)</p>
          <p className="mt-2 text-green-600">{empresa.status}</p>
          <div className="mt-5 flex flex-wrap gap-2">{empresa.tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{t}</span>)}</div>
        </div>
        <aside className="rounded-2xl bg-white p-6 shadow">
          <h2 className="font-black">Fale com a empresa</h2>
          <a href={`https://wa.me/${empresa.whatsapp}`} className="mt-4 block rounded-xl bg-green-600 px-4 py-3 text-center font-black text-white">Chamar no WhatsApp</a>
          <button className="mt-3 w-full rounded-xl border px-4 py-3 font-black">Ver promoções</button>
        </aside>
      </section>
    </main>
  );
}
