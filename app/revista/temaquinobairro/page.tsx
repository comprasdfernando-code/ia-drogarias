import Header from './components/Header'
import SearchBox from './components/SearchBox'
import Categorias from './components/Categorias'
import EmpresaCard from './components/EmpresaCard'
import { empresas } from './data/mock'

export default function TemaAquiNoBairroHome() {
  return <main className="min-h-screen bg-slate-50 text-[#06122b]">
    <Header />
    <section className="relative overflow-hidden bg-[#06122b]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(255,255,255,.20),transparent_28%),linear-gradient(90deg,rgba(6,18,43,.95),rgba(6,18,43,.55))]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 md:grid-cols-[1.1fr_.9fr]">
        <div className="text-white"><h1 className="max-w-2xl text-5xl font-black leading-tight md:text-6xl">Descubra o melhor <span className="text-yellow-400">do seu bairro!</span></h1>
        <p className="mt-5 max-w-xl text-xl text-white/90">Encontre comércios, serviços, promoções e eventos pertinho de você.</p></div>
        <div className="rounded-3xl bg-white/10 p-6 text-white shadow-2xl ring-1 ring-white/20"><p className="text-5xl">📍</p><h2 className="mt-3 text-2xl font-black">Valorize o que é do seu bairro!</h2><p className="mt-2 text-white/80">Compre local, fortaleça nossa comunidade e gere empregos.</p></div>
      </div>
    </section>
    <SearchBox />
    <Categorias />
    <section className="mx-auto max-w-7xl px-5">
      <div className="rounded-3xl bg-[#06122b] p-6 text-white shadow-xl md:flex md:items-center md:justify-between"><div><p className="text-4xl">📣</p><h2 className="mt-2 text-3xl font-black">Divulgue seu negócio e alcance mais clientes!</h2><p className="mt-1 text-white/75">Apareça para moradores que já procuram pelo seu serviço.</p></div><a href="/revista/temaquinobairro/anuncie" className="mt-5 inline-block rounded-xl bg-yellow-400 px-6 py-3 font-black text-slate-900 md:mt-0">Anuncie Agora!</a></div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-10"><div className="mb-5 flex items-center justify-between"><h2 className="text-3xl font-black">Destaques do Bairro</h2><a className="font-bold text-red-600" href="/revista/temaquinobairro/bairros/jd-rodolfo-pirani">Ver todos →</a></div><div className="grid gap-5 md:grid-cols-3">{empresas.map(e => <div key={e.slug} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="grid h-32 place-items-center rounded-xl bg-slate-100 text-center text-2xl font-black text-red-600 whitespace-pre-line">{e.logo}</div><h3 className="mt-4 text-xl font-black">{e.nome}</h3><p className="text-sm text-slate-500">{e.categoria}</p><p className="mt-2 text-sm">{e.nota} ⭐⭐⭐⭐⭐</p><a className="mt-4 block rounded-xl bg-green-600 px-4 py-3 text-center font-black text-white" href={`https://wa.me/55${e.whatsapp}`}>WhatsApp</a></div>)}</div></section>
    <section className="mx-auto max-w-7xl px-5 pb-12"><div className="grid gap-4 md:grid-cols-4">{['Tudo perto de você','Informações confiáveis','Promoções exclusivas','Eventos do bairro'].map((t,i)=><div key={t} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><div className="mb-3 text-3xl">{['🏪','🛡️','🏷️','📅'][i]}</div><h3 className="font-black">{t}</h3><p className="mt-2 text-sm text-slate-600">Uma experiência simples para conectar moradores e comércio local.</p></div>)}</div></section>
  </main>
}
