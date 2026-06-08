import Link from 'next/link';
import { Empresa } from './data';

const base = '/revista/temaquinobairro';

export default function EmpresaCard({ empresa }: { empresa: Empresa }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow hover:shadow-xl transition">
      <div className="relative h-28 bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="absolute left-3 top-3 rounded-lg bg-yellow-400 px-2 py-1 text-xs font-black text-slate-900">
          {empresa.plano === 'gratuito' ? 'Local' : empresa.plano}
        </div>
        <div className="grid h-full place-items-center text-5xl">🏪</div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-black text-slate-950">{empresa.nome}</h3>
        <p className="text-sm text-slate-500">{empresa.descricao}</p>
        <div className="mt-2 text-sm font-semibold text-slate-700">⭐ {empresa.avaliacao} <span className="font-normal text-slate-400">({empresa.totalAvaliacoes})</span></div>
        <p className="mt-1 text-sm text-green-600">{empresa.status}</p>
        <div className="mt-4 flex gap-2">
          <a href={`https://wa.me/${empresa.whatsapp}`} className="flex-1 rounded-xl bg-green-600 px-3 py-2 text-center text-sm font-bold text-white">WhatsApp</a>
          <Link href={`${base}/empresas/${empresa.slug}`} className="rounded-xl border px-3 py-2 text-sm font-bold text-slate-700">Ver</Link>
        </div>
      </div>
    </article>
  );
}
