import Link from 'next/link';
import Header from './components/Header';
import SearchBox from './components/SearchBox';
import Categorias from './components/Categorias';
import EmpresaCard from './components/EmpresaCard';
import { empresas, promocoes } from './components/data';

const base = '/revista/temaquinobairro';

export default function TemaAquiNoBairroHome() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Header />
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#1d4ed8,transparent_35%),linear-gradient(90deg,#020617,rgba(15,23,42,.78))]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex rounded-full bg-yellow-400 px-4 py-1 text-sm font-black text-slate-950">REVISTA + GUIA COMERCIAL DO BAIRRO</p>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">Descubra o melhor <span className="text-yellow-400">do seu bairro!</span></h1>
            <p className="mt-4 text-lg text-slate-200 md:text-2xl">Encontre comércios, serviços, promoções, eventos e novidades pertinho de você.</p>
          </div>
          <div className="mt-10"><SearchBox /></div>
        </div>
      </section>

      <Categorias />

      <section className="mx-auto mt-8 max-w-7xl px-4">
        <div className="rounded-3xl bg-slate-950 p-6 text-white md:flex md:items-center md:justify-between">
          <div>
            <p className="text-3xl">📣</p>
            <h2 className="text-2xl font-black text-yellow-400">Divulgue seu negócio e alcance mais clientes!</h2>
            <p className="mt-1 text-slate-200">Apareça para milhares de pessoas do seu bairro.</p>
          </div>
          <Link href={`${base}/anuncie`} className="mt-5 inline-flex rounded-xl bg-yellow-400 px-6 py-3 font-black text-slate-950 md:mt-0">Anuncie agora</Link>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black">Destaques do Bairro</h2>
          <Link href={`${base}/bairros/jd-rodolfo-pirani`} className="font-bold text-red-600">Ver todos →</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {empresas.map((empresa) => <EmpresaCard key={empresa.slug} empresa={empresa} />)}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 pb-16">
        <h2 className="mb-5 text-2xl font-black">Promoções imperdíveis</h2>
        <div className="grid gap-5 md:grid-cols-4">
          {promocoes.map((p) => (
            <div key={p.titulo} className="rounded-2xl bg-white p-5 shadow">
              <p className="text-sm font-black uppercase text-red-600">{p.empresa}</p>
              <h3 className="mt-2 text-xl font-black">{p.titulo}</h3>
              <p className="mt-2 text-slate-600">{p.texto}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
