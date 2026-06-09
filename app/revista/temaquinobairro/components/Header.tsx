import Link from 'next/link'
import Image from 'next/image'

const base = '/revista/temaquinobairro'

export default function Header() {
  const nav = [
    ['Início', base],
    ['Buscar', `${base}/bairros/jd-rodolfo-pirani`],
    ['Empresas', `${base}/bairros/jd-rodolfo-pirani`],
    ['Promoções', `${base}/promocoes`],
    ['Revista', `${base}/revista`],
    ['Anuncie', `${base}/anuncie`],
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#06122B] text-white shadow-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4">

        {/* LOGO */}
        <Link href={base} className="flex items-center">
          <Image
            src="/logo-tem-aqui-no-bairro.png"
            alt="Tem Aqui no Bairro"
            width={260}
            height={90}
            priority
            className="h-auto w-auto object-contain"
          />
        </Link>

        {/* MENU */}
        <nav className="hidden items-center gap-8 text-sm font-bold lg:flex">
          {nav.map(([label, href], index) => (
            <Link
              key={label}
              href={href}
              className={`transition-all duration-200 ${
                index === 0
                  ? 'border-b-4 border-red-500 pb-3 text-white'
                  : 'pb-3 text-white hover:text-yellow-300'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* DIREITA */}
        <div className="hidden items-center gap-6 lg:flex">

          <div className="flex items-center gap-2 font-semibold text-white">
            <span className="text-xl">📍</span>
            São Mateus - SP
          </div>

          <Link
            href={`${base}/anuncie`}
            className="rounded-xl bg-red-600 px-6 py-3 font-black shadow-lg transition hover:bg-red-700"
          >
            Entrar / Cadastrar
          </Link>

        </div>

      </div>
    </header>
  )
}