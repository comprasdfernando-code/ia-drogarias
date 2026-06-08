import Header from './components/Header'
import SearchBox from './components/SearchBox'
import Categories from './components/Categories'
import EmpresaCard from './components/EmpresaCard'
import { empresas, promocoes } from './data/mock'

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <section className="relative overflow-hidden bg-[#06142d] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,197,94,.35),transparent_28%),radial-gradient(circle_at_45%_50%,rgba(59,130,246,.4),transparent_25%),linear-gradient(90deg,#06142d_0%,rgba(6,20,45,.86)_44%,rgba(6,20,45,.25)_100%)]" />
        <div className="absolute bottom-0 right-0 h-64 w-[70%] opacity-80 [background:linear-gradient(135deg,transparent_10%,rgba(255,255,255,.18)_11%,transparent_12%),repeating-linear-gradient(90deg,rgba(255,255,255,.12)_0_12px,transparent_12px_70px)]" />
        <div className="relative mx-auto grid max-w-[1500px] items-center gap-8 px-8 py-20 lg:grid-cols-[1fr_560px]">
          <div>
            <h1 className="max-w-2xl text-5xl font-black leading-tight lg:text-7xl">Descubra o melhor <span className="text-yellow-400">do seu bairro!</span></h1>
            <p className="mt-5 max-w-xl text-2xl text-white/90">Encontre comércios, serviços, promoções e eventos pertinho de você.</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-8 backdrop-blur">
            <h2 className="text-3xl font-black">📍 Valorize o que é do seu bairro!</h2>
            <p className="mt-3 text-lg text-white/85">Compre local, fortaleça nossa comunidade.</p>
          </div>
        </div>
      </section>
      <SearchBox bairro="Selecione seu bairro" />
      <Categories />
      <section className="mx-auto mt-10 max-w-[1320px] px-6">
        <div className="rounded-2xl bg-[#06142d] p-7 text-white shadow-xl md:flex md:items-center md:justify-between">
          <div className="flex items-center gap-5"><span className="text-6xl">📣</span><div><h2 className="text-3xl font-black text-yellow-400">DIVULGUE SEU NEGÓCIO</h2><p>Apareça para milhares de pessoas do seu bairro.</p></div></div>
          <a className="mt-5 inline-block rounded-xl bg-yellow-400 px-8 py-4 font-black text-slate-950 md:mt-0" href="/revista/temaquinobairro/anuncie">Anuncie Agora!</a>
        </div>
      </section>
      <section className="mx-auto mt-10 max-w-[1320px] px-6">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-3xl font-black text-slate-950">Destaques do bairro</h2><a className="font-bold text-red-600" href="/revista/temaquinobairro/bairros/jd-rodolfo-pirani">Ver todos →</a></div>
        <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-5">{empresas.map(e => <EmpresaCard key={e.nome} empresa={e} />)}</div>
      </section>
      <section className="mx-auto mt-10 grid max-w-[1320px] gap-5 px-6 pb-16 md:grid-cols-3">
        {promocoes.map(p => <div key={p.titulo} className={`${p.cor} rounded-2xl p-8 text-white shadow-xl`}><p className="text-lg font-bold">{p.titulo}</p><h3 className="mt-2 text-4xl font-black">{p.texto}</h3></div>)}
      </section>
    </main>
  )
}
