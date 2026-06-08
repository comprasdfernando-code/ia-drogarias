import Header from '../components/Header'
import { promocoes } from '../data/mock'
export default function Page(){return <main className="min-h-screen bg-slate-50"><Header/><section className="mx-auto max-w-7xl px-6 py-16"><h1 className="text-5xl font-black text-slate-950">Promoções</h1><div className="mt-8 grid gap-5 md:grid-cols-3">{promocoes.map(p=><div key={p.titulo} className={`${p.cor} rounded-2xl p-8 text-white`}><h2 className="text-3xl font-black">{p.texto}</h2><p>{p.titulo}</p></div>)}</div></section></main>}
