import Link from 'next/link'
import { empresas } from '../data/mock'
export default function EmpresaCard({ empresa }: { empresa: typeof empresas[number] }) {
  return <article className="grid gap-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-[150px_1fr_230px_170px]">
    <div className="relative grid h-36 place-items-center rounded-xl border bg-slate-50 text-center text-2xl font-black text-red-600 whitespace-pre-line">
      <span className="absolute left-2 top-2 rounded-md bg-yellow-400 px-2 py-1 text-[11px] text-slate-900">{empresa.plano}</span>{empresa.logo}
    </div>
    <div>
      <h3 className="text-2xl font-black text-[#06122b]">{empresa.nome}</h3>
      <p className="text-sm text-slate-500">{empresa.categoria}</p>
      <p className="mt-2 text-sm"><b>{empresa.nota}</b> ⭐⭐⭐⭐⭐ <span className="text-slate-500">({empresa.avaliacoes} avaliações)</span></p>
      <p className="mt-2 text-sm text-slate-700">📍 {empresa.endereco}</p>
      <p className="mt-1 text-sm font-bold text-green-600">{empresa.status}</p>
      <div className="mt-3 flex flex-wrap gap-2">{empresa.tags.map(t => <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{t}</span>)}</div>
    </div>
    <div className="rounded-xl border border-dashed border-red-300 bg-red-50 p-4 text-center">
      <p className="font-black text-red-600">OFERTA DO BAIRRO</p><p className="mt-2 text-sm text-slate-700">{empresa.promo}</p>
      <button className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white">Ver promoção</button>
    </div>
    <div className="flex flex-col items-stretch justify-center gap-3">
      <a href={`https://wa.me/55${empresa.whatsapp}`} className="rounded-xl bg-green-600 px-4 py-3 text-center font-black text-white">WhatsApp</a>
      <p className="text-center text-sm text-slate-700">☎ {empresa.telefone}</p>
      <Link href={`/revista/temaquinobairro/empresas/${empresa.slug}`} className="rounded-xl border px-4 py-3 text-center font-bold">Ver detalhes</Link>
    </div>
  </article>
}
