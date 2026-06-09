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
    <header className="sticky top-0 z-50 bg-[#06122B] text-white shadow-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-8 py-3">
        <Link href={base} className="shrink-0">
          <Image
  src="/logo-tem-aqui-no-bairro.png"
  alt="Tem Aqui no Bairro"
  width={180}
  height={70}
  priority
  className="object-contain"
/>
        </Link>

        <nav className="hidden items-center gap-10 text-lg font-bold lg:flex">
          {nav.map(([label, href], index) => (
            <Link
              key={label}
              href={href}
              className={`transition-all duration-200 ${
                index === 0
                  ? 'border-b-4 border-red-500 pb-2'
                  : 'hover:text-yellow-300'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-8 lg:flex">
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="text-2xl">📍</span>
            São Mateus - SP
          </div>

          <Link
            href={`${base}/anuncie`}
            className="rounded-xl bg-red-600 px-7 py-4 text-lg font-black shadow-lg transition hover:bg-red-700"
          >
            Entrar / Cadastrar
          </Link>
        </div>
      </div>
    </header>
  )
}