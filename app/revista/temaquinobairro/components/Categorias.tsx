import { categorias } from '../data/mock'

export default function Categorias() {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-[1320px] px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-black text-[#06122b]">
            Explore Categorias
          </h2>

          <span className="font-bold text-red-600">
            Ver todas →
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          {categorias.map((c, i) => (
            <button
              key={i}
              className="group rounded-3xl bg-white p-6 text-center shadow-md ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-3xl text-white shadow-lg transition-all duration-300 group-hover:scale-110">
                {c.icon}
              </div>

              <div className="text-sm font-black uppercase tracking-wide text-[#06122b]">
                {c.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}