import { categorias } from '../data/mock'

export default function Categorias() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        {categorias.map((c, i) => (
          <button
            key={i}
            className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-red-600 text-2xl font-black text-white">
              {c.icon}
            </div>

            <div className="text-sm font-black text-[#06122b]">
              {c.name}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}