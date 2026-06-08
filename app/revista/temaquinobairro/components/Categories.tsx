import { categories } from '../data/mock'

const colors = ['bg-red-600','bg-green-600','bg-orange-500','bg-blue-600','bg-purple-600','bg-yellow-500','bg-pink-500','bg-sky-600']
export default function Categories() {
  return (
    <div className="mx-auto mt-8 grid max-w-[1320px] grid-cols-2 gap-4 px-6 md:grid-cols-4 lg:grid-cols-8">
      {categories.map((cat, i) => (
        <button key={cat.name} className={`rounded-2xl border bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${cat.active ? 'border-b-4 border-b-red-600' : ''}`}>
          <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${colors[i]} text-2xl font-black text-white`}>{cat.icon}</div>
          <div className={`mt-3 font-black ${cat.active ? 'text-red-600' : 'text-slate-950'}`}>{cat.name}</div>
        </button>
      ))}
      <button className="rounded-2xl border bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-2xl font-black">...</div>
        <div className="mt-3 font-black text-slate-950">Mais categorias</div>
      </button>
    </div>
  )
}
