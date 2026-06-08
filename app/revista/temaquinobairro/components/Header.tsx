import Link from 'next/link'

const base = '/revista/temaquinobairro'

export default function Header() {
  const nav = [
    ['Início', base], ['Buscar', `${base}/bairros/jd-rodolfo-pirani`], ['Empresas', `${base}/bairros/jd-rodolfo-pirani`],
    ['Promoções', `${base}/promocoes`], ['Revista', `${base}/revista`], ['Anuncie', `${base}/anuncie`]
  ]
  return (
    <header className="sticky top-0 z-50 bg-[#06142d] text-white shadow-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-8 py-5">
        <Link href={base} className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-red-600 text-3xl shadow-lg">⌖</div>
          <div className="leading-none">
            <div className="text-3xl font-black tracking-tight">TEM <span className="rounded bg-red-600 px-2">AQUI</span></div>
            <div className="text-2xl font-black text-yellow-400">NO BAIRRO</div>
            <div className="mt-1 text-xs text-white/80">Tudo o que você precisa, perto de você!</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-9 text-sm font-bold lg:flex">
          {nav.map(([label, href], i) => <Link key={label} href={href} className={i === 0 ? 'border-b-4 border-red-500 pb-3' : 'pb-3 hover:text-yellow-300'}>{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-6 lg:flex">
          <div className="font-bold">📍 São Mateus - SP⌄</div>
          <Link href={`${base}/anuncie`} className="rounded-xl bg-red-600 px-7 py-4 font-black shadow-lg hover:bg-red-700">Entrar / Cadastrar</Link>
        </div>
      </div>
    </header>
  )
}
