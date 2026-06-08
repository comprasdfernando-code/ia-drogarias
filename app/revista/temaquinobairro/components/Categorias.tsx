import { categorias } from '../data/mock'
export default function Categorias() {
  return <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 py-8 md:grid-cols-4 lg:grid-cols-8">
    {categorias.map((c, i) => <button key={c.nome} className={`rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl ${i===0?'border-b-4 border-red-600':''}`}>
      <div className={`mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full ${c.cor} text-2xl font-black text-white`}>{c.icon}</div>
      <div className="text-sm font-black text-[#06122b]">{c.nome}</div>
    </button>)}
  </div>
}
