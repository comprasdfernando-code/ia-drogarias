export default function EmpresaCard({ empresa }: { empresa: any }) {
  return (
    <article className="relative rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      {empresa.selo && <span className={`absolute left-4 top-4 rounded px-3 py-1 text-xs font-black text-white ${empresa.selo === 'PATROCINADO' ? 'bg-orange-500' : 'bg-yellow-400 text-slate-950'}`}>{empresa.selo}</span>}
      <button className="absolute right-4 top-4 text-2xl text-slate-400">♡</button>
      <div className="mt-8 grid h-28 place-items-center whitespace-pre-line rounded-xl bg-slate-50 text-center text-2xl font-black text-red-600">
        {empresa.logo}
      </div>
      <h3 className="mt-5 text-xl font-black text-slate-950">{empresa.nome}</h3>
      <p className="text-slate-500">{empresa.categoria}</p>
      <p className="mt-3 text-sm font-bold text-slate-700">⭐ {empresa.nota} <span className="font-normal text-slate-400">({empresa.avaliacoes})</span></p>
      <a href={empresa.whatsapp} target="_blank" className="mt-4 block rounded-lg bg-green-600 py-3 text-center font-black text-white hover:bg-green-700">WhatsApp</a>
      <p className="mt-3 text-center text-sm font-bold text-slate-700">☎ {empresa.telefone}</p>
    </article>
  )
}
