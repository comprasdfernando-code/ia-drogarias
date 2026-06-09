export default function SearchBox({
  bairro = 'Jd. Rodolfo Pirani',
}: {
  bairro?: string
}) {
  return (
    <div className="relative z-30 mx-auto -mt-20 max-w-[1320px] px-6">
      <div className="overflow-hidden rounded-[32px] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,.18)]">

        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_220px_240px]">

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 px-5 py-5 transition hover:border-red-400">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-3xl text-red-600">
              🔍
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                O que você procura?
              </p>

              <p className="text-lg font-bold text-slate-900">
                Farmácia, Pizzaria, Mercado...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 px-5 py-5 transition hover:border-red-400">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-3xl text-red-600">
              📍
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Qual bairro?
              </p>

              <p className="text-lg font-bold text-slate-900">
                {bairro}
              </p>
            </div>
          </div>

          <button className="rounded-2xl bg-red-600 px-8 py-5 text-xl font-black text-white shadow-lg transition hover:bg-red-700">
            Buscar
          </button>

          <button className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-lg font-black text-slate-900 transition hover:bg-slate-50">
            📡 Minha Localização
          </button>

        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {[
            'Farmácia',
            'Pizzaria',
            'Mercado',
            'Pet Shop',
            'Mecânica',
            'Salão',
            'Dentista',
            'Delivery',
          ].map((item) => (
            <span
              key={item}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
            >
              {item}
            </span>
          ))}
        </div>

      </div>
    </div>
  )
}