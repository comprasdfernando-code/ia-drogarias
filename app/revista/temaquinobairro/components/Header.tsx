import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#06122b] text-white shadow-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/revista/temaquinobairro" className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-red-600 text-2xl shadow-lg">📍</div>
          <div className="leading-none">
            <div className="text-2xl font-black tracking-tight"><span>TEM </span><span className="rounded-md bg-red-600 px-2">AQUI</span></div>
            <div className="text-xl font-black text-yellow-400">NO BAIRRO</div>
            <div className="mt-1 text-[11px] text-white/75">Tudo o que você precisa, perto de você!</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-bold lg:flex">
          <Link href="/revista/temaquinobairro">Início</Link>
          <Link href="/revista/temaquinobairro/bairros/jd-rodolfo-pirani">Buscar</Link>
          <Link href="/revista/temaquinobairro/bairros/jd-rodolfo-pirani">Empresas</Link>
          <Link href="/revista/temaquinobairro/promocoes">Promoções</Link>
          <Link href="/revista/temaquinobairro/revista">Revista</Link>
          <Link href="/revista/temaquinobairro/anuncie">Anuncie</Link>
        </nav>
        <Link href="/revista/temaquinobairro/anuncie" className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black shadow-lg hover:bg-red-700">Entrar / Cadastrar</Link>
      </div>
    </header>
  )
}
