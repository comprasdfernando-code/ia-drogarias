import Header from '../components/Header';
import { promocoes } from '../components/data';

export default function PromocoesPage() {
  return <main className="min-h-screen bg-slate-50"><Header /><section className="mx-auto max-w-7xl px-4 py-10"><h1 className="text-4xl font-black">Promoções do bairro</h1><div className="mt-8 grid gap-5 md:grid-cols-4">{promocoes.map((p) => <div key={p.titulo} className="rounded-2xl bg-white p-5 shadow"><p className="text-sm font-black uppercase text-red-600">{p.empresa}</p><h2 className="mt-2 text-xl font-black">{p.titulo}</h2><p className="mt-2 text-slate-600">{p.texto}</p></div>)}</div></section></main>;
}
