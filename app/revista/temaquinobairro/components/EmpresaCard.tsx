export default function EmpresaCard({ empresa }: { empresa: any }) {
  const telefoneLimpo = String(
    empresa.whatsapp || empresa.telefone || ''
  ).replace(/\D/g, '')

  const whatsapp =
    empresa.whatsapp && String(empresa.whatsapp).startsWith('http')
      ? empresa.whatsapp
      : telefoneLimpo
        ? `https://wa.me/55${telefoneLimpo}`
        : '#'

  const pagina = empresa.pagina || empresa.site || '#'

  const logoImg =
    empresa.logoImg ||
    empresa.logo_img ||
    empresa.logo_url ||
    empresa.imagem ||
    ''

  const selo =
    empresa.selo ||
    (empresa.premium ? 'PREMIUM' : empresa.destaque ? 'DESTAQUE' : '')

  const nota = empresa.nota || '5,0'
  const avaliacoes = empresa.avaliacoes || 0

  return (
    <article className="group overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-slate-200 transition-all hover:-translate-y-2 hover:shadow-2xl">
      <div className="relative h-32 bg-gradient-to-r from-[#06122B] to-[#1d4ed8]">
        {selo && (
          <span
            className={`absolute left-4 top-4 rounded-full px-4 py-2 text-xs font-black ${
              selo === 'PREMIUM'
                ? 'bg-yellow-400 text-slate-950'
                : selo === 'PATROCINADO'
                  ? 'bg-orange-500 text-white'
                  : 'bg-red-600 text-white'
            }`}
          >
            {selo}
          </span>
        )}

        <button className="absolute right-4 top-4 text-2xl text-white/80">
          ♡
        </button>

        <div className="absolute -bottom-12 left-1/2 grid h-24 w-24 -translate-x-1/2 place-items-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl">
          {logoImg ? (
            <img
              src={logoImg}
              alt={empresa.nome || 'Empresa'}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <div className="whitespace-pre-line text-center text-sm font-black text-red-600">
              {empresa.logo || empresa.nome || 'Empresa'}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 pt-16 text-center">
        <h3 className="line-clamp-2 text-xl font-black text-slate-950">
          {empresa.nome}
        </h3>

        <p className="mt-1 text-sm font-semibold text-slate-500">
          {empresa.categoria}
        </p>

        <p className="mt-1 text-xs font-bold text-slate-400">
          📍 {empresa.bairro}
          {empresa.cidade ? ` • ${empresa.cidade}` : ''}
          {empresa.estado ? `/${empresa.estado}` : ''}
        </p>

        <div className="mt-4 font-bold text-slate-800">
          ⭐ {nota}{' '}
          <span className="font-normal text-slate-400">
            ({avaliacoes})
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={`block rounded-xl py-3 font-black text-white transition ${
              whatsapp === '#'
                ? 'pointer-events-none bg-slate-300'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            💬 WhatsApp
          </a>

          <a
            href={pagina}
            target="_blank"
            rel="noopener noreferrer"
            className={`block rounded-xl border border-slate-200 py-3 font-black text-slate-900 transition ${
              pagina === '#'
                ? 'pointer-events-none bg-slate-100 text-slate-400'
                : 'hover:bg-slate-50'
            }`}
          >
            Ver Página
          </a>
        </div>

        <p className="mt-4 border-t pt-4 text-sm font-bold text-slate-600">
          ☎ {empresa.telefone || empresa.whatsapp || 'Telefone não informado'}
        </p>
      </div>
    </article>
  )
}