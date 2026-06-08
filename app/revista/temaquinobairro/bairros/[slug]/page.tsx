import Header from '../../components/Header'
import SearchBox from '../../components/SearchBox'
import Categories from '../../components/Categories'
import EmpresaCard from '../../components/EmpresaCard'
import { empresas } from '../../data/mock'

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <section className="relative overflow-hidden bg-[#06142d] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(34,197,94,.42),transparent_28%),radial-gradient(circle_at_50%_55%,rgba(14,165,233,.36),transparent_28%),linear-gradient(90deg,#06142d_0%,rgba(6,20,45,.86)_40%,rgba(6,20,45,.15)_100%)]" />
        <div className="absolute bottom-0 right-0 h-full w-[72%] opacity-90 [background:linear-gradient(135deg,transparent_10%,rgba(255,255,255,.16)_11%,transparent_12%),repeating-linear-gradient(90deg,rgba(255,255,255,.13)_0_10px,transparent_10px_72px)]" />
        <div className="relative mx-auto max-w-[1500px] px-8 pb-24 pt-9">
          <p className="mb-8 text-sm text-white/80">Início › Bairros › Jd. Rodolfo Pirani</p>
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_480px]">
            <div>
              <h1 className="flex items-center gap-5 text-5xl font-black lg:text-7xl"><span className="text-red-500">📍</span>Jd. Rodolfo Pirani</h1>
              <p className="mt-5 max-w-xl text-2xl text-white/90">Encontre os melhores comércios e serviços no Jd. Rodolfo Pirani.</p>
              <div className="mt-8 grid max-w-3xl gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-white p-5 text-slate-950"><b className="text-2xl">312</b><p className="text-sm">Empresas cadastradas</p></div>
                <div className="rounded-xl bg-white p-5 text-slate-950"><b className="text-2xl">25+</b><p className="text-sm">Categorias</p></div>
                <div className="rounded-xl bg-white p-5 text-slate-950"><b className="text-2xl">4.8</b><p className="text-sm">Avaliação média</p></div>
              </div>
            </div>
            <div className="rounded-3xl bg-[#06142d]/90 p-8 shadow-2xl ring-1 ring-white/10">
              <div className="flex gap-5"><div className="grid h-24 w-24 place-items-center rounded-2xl bg-white text-5xl">🗺️</div><div><h2 className="text-2xl font-black">Valorize o comércio local</h2><p className="mt-2 text-white/80">Comprando no bairro, você fortalece nossa comunidade e gera empregos!</p></div></div>
            </div>
          </div>
        </div>
      </section>
      <SearchBox />
      <Categories />
      <section className="mx-auto mt-8 grid max-w-[1500px] gap-6 px-6 pb-16 lg:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black text-slate-950">⭐ Destaques do bairro</h2><a className="font-bold text-blue-600">Ver todas as empresas →</a></div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">{empresas.map(e => <EmpresaCard key={e.nome} empresa={e} />)}</div>
        </div>
        <aside className="space-y-5">
          <div className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="text-xl font-black text-slate-950">Mapa do bairro</h3><div className="mt-4 grid h-48 place-items-center rounded-xl bg-red-50 text-center font-black text-red-600">📍<br/>Jd. Rodolfo Pirani</div><p className="mt-3 font-bold text-red-600">Ver no Google Maps ↗</p></div>
          <div className="rounded-2xl bg-[#06142d] p-6 text-white shadow-xl"><h3 className="text-xl font-black">Anuncie seu negócio!</h3><p className="mt-2 text-white/80">Seja encontrado por mais clientes no Jd. Rodolfo Pirani.</p><a className="mt-5 inline-block rounded-lg bg-yellow-400 px-5 py-3 font-black text-slate-950" href="/revista/temaquinobairro/anuncie">Quero anunciar</a></div>
        </aside>
      </section>
    </main>
  )
}
