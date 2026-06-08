import Header from '../../components/Header';
import SearchBox from '../../components/SearchBox';
import Categorias from '../../components/Categorias';
import EmpresaCard from '../../components/EmpresaCard';
import { bairros, empresas } from '../../components/data';

export default function BairroPage({ params }: { params: { slug: string } }) {
  const bairro = bairros.find((b) => b.slug === params.slug) ?? bairros[0];
  const list = empresas.filter((e) => e.bairroSlug === bairro.slug);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Header />
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <p className="text-sm text-slate-300">Início › Bairros › {bairro.nome}</p>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">📍 {bairro.nome}</h1>
          <p className="mt-3 text-xl text-slate-200">Encontre os melhores comércios e serviços no {bairro.nome}.</p>
          <div className="mt-8 grid gap-4 rounded-2xl bg-white/10 p-4 md:grid-cols-3">
            <div><b className="text-2xl">{list.length * 78}</b><p>Empresas cadastradas</p></div>
            <div><b className="text-2xl">25+</b><p>Categorias</p></div>
            <div><b className="text-2xl">4.8</b><p>Avaliação média</p></div>
          </div>
        </div>
      </section>
      <div className="mx-auto -mt-8 max-w-7xl px-4"><SearchBox bairro={bairro.nome} /></div>
      <Categorias />
      <section className="mx-auto mt-10 grid max-w-7xl gap-6 px-4 pb-16 lg:grid-cols-[260px_1fr_260px]">
        <aside className="rounded-2xl bg-white p-5 shadow">
          <h2 className="font-black">Sobre o bairro</h2>
          <p className="mt-3 text-sm text-slate-600">O {bairro.nome} é um bairro com comércio forte, serviços próximos e oportunidades para moradores e comerciantes.</p>
          <h3 className="mt-6 font-black">Filtrar resultados</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <label className="block"><input type="checkbox" defaultChecked /> Todos</label>
            <label className="block"><input type="checkbox" /> Destaques</label>
            <label className="block"><input type="checkbox" /> Patrocinados</label>
          </div>
        </aside>
        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold">Mostrando 1 - {list.length} resultados em {bairro.nome}</p>
            <select className="rounded-xl border bg-white px-3 py-2"><option>Mais relevantes</option><option>Melhor avaliação</option></select>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {list.map((empresa) => <EmpresaCard key={empresa.slug} empresa={empresa} />)}
          </div>
        </section>
        <aside className="space-y-5">
          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="font-black">Mapa do bairro</h2>
            <div className="mt-3 grid h-40 place-items-center rounded-xl bg-slate-100 text-5xl">🗺️</div>
            <p className="mt-3 text-sm text-slate-600">Mapa, raio de entrega e região atendida.</p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-5 text-white shadow">
            <h2 className="font-black text-yellow-400">Anuncie seu negócio</h2>
            <p className="mt-2 text-sm text-slate-200">Seja encontrado por mais clientes no {bairro.nome}.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
