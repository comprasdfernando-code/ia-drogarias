import Header from '../../components/Header'
import SearchBox from '../../components/SearchBox'
import Categorias from '../../components/Categorias'
import EmpresaCard from '../../components/EmpresaCard'
import { empresas } from '../../data/mock'

export default function BairroPage() {
  return <main className="min-h-screen bg-slate-50 text-[#06122b]"><Header />
    <section className="relative bg-[#06122b] text-white"><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,18,43,.95),rgba(6,18,43,.55)),radial-gradient(circle_at_70%_50%,rgba(255,255,255,.18),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-5 py-16"><p className="text-sm text-white/70">Início › Bairros › Jd. Rodolfo Pirani</p><h1 className="mt-6 text-5xl font-black">📍 Jd. Rodolfo Pirani</h1><p className="mt-3 max-w-xl text-xl text-white/90">Encontre os melhores comércios e serviços no Jd. Rodolfo Pirani.</p>
      <div className="mt-8 grid max-w-3xl gap-3 md:grid-cols-3"><div className="rounded-2xl bg-white p-4 text-[#06122b]"><b className="text-2xl">312</b><p className="text-sm">Empresas cadastradas</p></div><div className="rounded-2xl bg-white p-4 text-[#06122b]"><b className="text-2xl">25+</b><p className="text-sm">Categorias</p></div><div className="rounded-2xl bg-white p-4 text-[#06122b]"><b className="text-2xl">4.8</b><p className="text-sm">Avaliação média</p></div></div></div>
    </section>
    <SearchBox bairro="Jd. Rodolfo Pirani"/><Categorias />
    <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-14 lg:grid-cols-[260px_1fr_260px]"><aside className="space-y-4"><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><h3 className="font-black">Sobre o bairro</h3><p className="mt-3 text-sm text-slate-600">Bairro tradicional da Zona Leste, com variedade de comércios, serviços e opções para o dia a dia.</p><a className="mt-3 block text-sm font-bold text-red-600">Saiba mais →</a></div><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><h3 className="font-black">Categorias</h3>{['Todas as categorias','Saúde','Alimentação','Automóveis','Pet Shop','Mercado','Beleza','Serviços'].map(i => <p key={i} className="mt-2 text-sm text-slate-700">{i}</p>)}</div></aside>
      <div><div className="mb-4 flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-slate-200"><p className="text-sm">Mostrando 1 - 12 de 58 resultados em Jd. Rodolfo Pirani</p><select className="rounded-lg border px-3 py-2 text-sm"><option>Mais relevantes</option></select></div><div className="space-y-4">{empresas.map(e => <EmpresaCard key={e.slug} empresa={e}/>)}</div></div>
      <aside className="space-y-4"><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><h3 className="font-black">Mapa do bairro</h3><div className="mt-3 grid h-48 place-items-center rounded-xl bg-red-50 text-5xl">🗺️</div><a className="mt-3 block text-sm font-bold text-red-600">Ver no Google Maps →</a></div><div className="rounded-2xl bg-[#06122b] p-5 text-white shadow-sm"><h3 className="font-black">ANUNCIE SEU NEGÓCIO!</h3><p className="mt-2 text-sm text-white/75">Seja encontrado por mais clientes no Jd. Rodolfo Pirani.</p><a className="mt-4 block rounded-xl bg-yellow-400 px-4 py-3 text-center font-black text-slate-900" href="/revista/temaquinobairro/anuncie">Quero anunciar</a></div></aside>
    </section>
  </main>
}
