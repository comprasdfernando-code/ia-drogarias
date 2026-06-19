import Header from './components/Header'
import SearchBox from './components/SearchBox'
import Categories from './components/Categories'
import EmpresaCard from './components/EmpresaCard'
import { empresas, promocoes } from './data/mock'

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <section
        className="relative min-h-[560px] overflow-hidden text-white md:min-h-[650px]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(6,18,43,.96) 0%, rgba(6,18,43,.84) 45%, rgba(6,18,43,.25) 100%), url('/bairros/jd-rodolfo-pirani.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="mx-auto max-w-[1500px] px-4 pb-24 pt-16 md:px-8 md:pt-24">
          <div className="max-w-4xl">
            <div className="text-3xl md:text-5xl">📍</div>

            <p className="mt-4 text-2xl font-light tracking-wide md:text-4xl">
              JARDIM
            </p>

            <h1 className="mt-2 text-4xl font-black leading-none tracking-tight md:text-6xl lg:text-8xl">
              RODOLFO PIRANI
            </h1>

            <p className="mt-4 text-2xl font-light md:text-4xl">
              São Mateus - SP
            </p>

            <p className="mt-5 max-w-2xl text-base font-medium text-white/90 md:text-2xl">
              Encontre comércios, serviços, promoções e novidades perto de você.
            </p>
          </div>
        </div>
      </section>

      <SearchBox bairro="Jd. Rodolfo Pirani" />

      <Categories />

      <section className="mx-auto mt-6 max-w-[1320px] px-4 md:mt-10 md:px-6">
        <div className="rounded-3xl bg-[#06142d] p-5 text-white shadow-xl md:flex md:items-center md:justify-between md:p-7">
          <div className="flex items-center gap-4">
            <span className="text-4xl md:text-6xl">📣</span>

            <div>
              <h2 className="text-xl font-black text-yellow-400 md:text-3xl">
                DIVULGUE SEU NEGÓCIO
              </h2>

              <p className="mt-1 text-sm text-white/80 md:text-base">
                Apareça para milhares de pessoas do seu bairro.
              </p>
            </div>
          </div>

          <a
            className="mt-5 block rounded-xl bg-yellow-400 px-6 py-4 text-center font-black text-slate-950 md:mt-0 md:inline-block md:px-8"
            href="/revista/temaquinobairro/cadastro"
          >
            Cadastrar Comércio
          </a>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-[1320px] px-4 md:mt-10 md:px-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-slate-950 md:text-3xl">
            Destaques do bairro
          </h2>

          <a
            className="text-sm font-bold text-red-600 md:text-base"
            href="/revista/temaquinobairro/buscar?bairro=Jd.+Rodolfo+Pirani"
          >
            Ver todos →
          </a>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {empresas.map((e) => (
            <EmpresaCard key={e.nome} empresa={e} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-[1320px] gap-4 px-4 pb-16 md:mt-10 md:grid-cols-3 md:px-6">
        {promocoes.map((p) => (
          <div
            key={p.titulo}
            className={`${p.cor} rounded-3xl p-6 text-white shadow-xl md:p-8`}
          >
            <p className="text-base font-bold md:text-lg">{p.titulo}</p>
            <h3 className="mt-2 text-3xl font-black md:text-4xl">
              {p.texto}
            </h3>
          </div>
        ))}
      </section>
    </main>
  )
}