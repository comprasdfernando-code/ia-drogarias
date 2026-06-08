import Link from 'next/link';

const base = '/revista/temaquinobairro';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-slate-950 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href={base} className="flex items-center gap-2">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-red-600 text-2xl">📍</div>
          <div className="leading-tight">
            <div className="text-xl font-black tracking-tight"><span>TEM </span><span className="rounded bg-red-600 px-1">AQUI</span></div>
            <div className="text-lg font-black text-yellow-400">NO BAIRRO</div>
            <div className="text-[11px] text-slate-300">Tudo perto de você</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
          <Link href={base}>Início</Link>
          <Link href={`${base}/bairros/jd-rodolfo-pirani`}>Buscar</Link>
          <Link href={`${base}/promocoes`}>Promoções</Link>
          <Link href={`${base}/revista`}>Revista</Link>
          <Link href={`${base}/anuncie`}>Anuncie</Link>
        </nav>

        <Link href={`${base}/anuncie`} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold hover:bg-red-700">
          Entrar / Cadastrar
        </Link>
      </div>
    </header>
  );
}
