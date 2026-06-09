export default function EmpresaCard({ empresa }: { empresa: any }) {
  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-slate-200 transition-all hover:-translate-y-2 hover:shadow-2xl">
      <div className="relative h-32 bg-gradient-to-r from-[#06122B] to-[#1d4ed8]">
        {empresa.selo && (
          <span className="absolute left-4 top-4 rounded-full bg-yellow-400 px-4 py-2 text-xs font-black text-slate-950">
            {empresa.selo}
          </span>
        )}

        <button className="absolute right-4 top-4 text-2xl text-white/80">
          ♡
        </button>

        <div className="absolute -bottom-12 left-1/2 grid h-24 w-24 -translate-x-1/2 place-items-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl">
          {empresa.logoImg ? (
            <img
              src={empresa.logoImg}
              alt={empresa.nome}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <div className="whitespace-pre-line text-center text-sm font-black text-red-600">
              {empresa.logo}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 pt-16 text-center">
        <h3 className="text-xl font-black text-slate-950">
          {empresa.nome}
        </h3>

        <p className="mt-1 text-sm font-semibold text-slate-500">
          {empresa.categoria}
        </p>

        <p className="mt-1 text-xs font-bold text-slate-400">
          📍 {empresa.bairro}
        </p>

        <div className="mt-4 font-bold text-slate-800">
          ⭐ {empresa.nota}{' '}
          <span className="font-normal text-slate-400">
            ({empresa.avaliacoes})
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <a
            href={empresa.whatsapp}
            target="_blank"
            className="block rounded-xl bg-green-600 py-3 font-black text-white transition hover:bg-green-700"
          >
            💬 WhatsApp
          </a>

          <a
            href={empresa.pagina}
            target="_blank"
            className="block rounded-xl border border-slate-200 py-3 font-black text-slate-900 transition hover:bg-slate-50"
          >
            Ver Página
          </a>
        </div>

        <p className="mt-4 border-t pt-4 text-sm font-bold text-slate-600">
          ☎ {empresa.telefone}
        </p>
      </div>
    </article>
  )
}