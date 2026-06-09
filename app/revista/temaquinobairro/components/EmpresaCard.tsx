export default function EmpresaCard({ empresa }: { empresa: any }) {
  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

      {/* CAPA */}
      <div className="relative h-36 bg-gradient-to-r from-[#06122B] via-[#0d2b5e] to-[#1d4ed8]">

        {empresa.selo && (
          <span
            className={`absolute left-4 top-4 rounded-full px-4 py-2 text-xs font-black ${
              empresa.selo === 'PATROCINADO'
                ? 'bg-orange-500 text-white'
                : 'bg-yellow-400 text-slate-950'
            }`}
          >
            {empresa.selo}
          </span>
        )}

        <button className="absolute right-4 top-4 text-2xl text-white/80 hover:text-red-500">
          ♡
        </button>

        <div className="absolute -bottom-10 left-1/2 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-3xl border-4 border-white bg-white text-center text-lg font-black text-red-600 shadow-xl whitespace-pre-line">
          {empresa.logo}
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="px-5 pb-5 pt-14">

        <h3 className="line-clamp-2 text-center text-xl font-black text-slate-950">
          {empresa.nome}
        </h3>

        <p className="mt-1 text-center font-semibold text-slate-500">
          {empresa.categoria}
        </p>

        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-yellow-500">⭐</span>

          <span className="font-black text-slate-800">
            {empresa.nota}
          </span>

          <span className="text-slate-400">
            ({empresa.avaliacoes})
          </span>
        </div>

        <div className="mt-5 space-y-3">

          <a
  href={empresa.pagina}
  target="_blank"
  className="block w-full rounded-xl border border-slate-200 py-3 text-center font-black text-slate-900 transition hover:bg-slate-50"
>
  Ver Página
</a>

          <button
            className="block w-full rounded-xl border border-slate-200 py-3 text-center font-black text-slate-900 transition hover:bg-slate-50"
          >
            Ver Perfil
          </button>

        </div>

        <div className="mt-4 border-t pt-4 text-center text-sm font-semibold text-slate-600">
          ☎ {empresa.telefone}
        </div>

      </div>
    </article>
  )
}