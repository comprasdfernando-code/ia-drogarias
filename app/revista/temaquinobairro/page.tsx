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
        className="relative min-h-[650px] overflow-hidden text-white"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(6,18,43,.96) 0%, rgba(6,18,43,.82) 38%, rgba(6,18,43,.18) 100%), url('/bairros/jd-rodolfo-pirani.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="mx-auto max-w-[1500px] px-8 pt-28">
          <div className="max-w-4xl">
            <div className="text-5xl">📍</div>

            <p className="mt-5 text-4xl font-light tracking-wide">
              JARDIM
            </p>

            <h1 className="mt-2 text-6xl font-black leading-none tracking-tight lg:text-8xl">
              RODOLFO PIRANI
            </h1>

            <p className="mt-5 text-4xl font-light">
              São Mateus - SP
            </p>

            <div className="mt-10 max-w-5xl rounded-3xl bg-white p-4 shadow-2xl">
              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_180px]">
                <div className="flex items-center gap-4 rounded-2xl bg-white px-4 py-4 text-slate-700 ring-1 ring-slate-200">
                  <span className="text-3xl">🔍</span>
                  <div>
                    <p className="text-lg font-semibold">Buscar comércio ou serviço</p>
                    <p className="text-sm text-slate-400">
                      Ex: Farmácia, Pizzaria, Mecânico...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-white px-4 py-4 text-slate-700 ring-1 ring-slate-200">
                  <span className="text-3xl">📍</span>
                  <div>
                    <p className="text-lg font-semibold">Buscar bairro</p>
                    <p className="text-sm text-slate-400">
                      Jd. Rodolfo Pirani
                    </p>
                  </div>
                </div>

                <a
                  href="/revista/temaquinobairro/bairros/jd-rodolfo-pirani"
                  className="grid place-items-center rounded-2xl bg-red-600 px-8 py-5 text-xl font-black text-white shadow-lg transition hover:bg-red-700"
                >
                  Buscar
                </a>
              </div>
            </div>

            <div className="mt-7 max-w-5xl rounded-3xl bg-slate-900/70 p-6 shadow-2xl backdrop-blur">
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
                {[
                  ['🛍️', 'COMÉRCIO LOCAL'],
                  ['🍴', 'ONDE COMER'],
                  ['❤️', 'SAÚDE E BEM-ESTAR'],
                  ['🚗', 'SERVIÇOS E AUTOMÓVEIS'],
                  ['🐾', 'MUNDO PET'],
                  ['🗓️', 'EVENTOS E NOVIDADES'],
                ].map(([icon, label]) => (
                  <div key={label} className="text-center">
                    <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/10 text-4xl">
                      {icon}
                    </div>
                    <p className="mt-3 text-sm font-black leading-tight">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Categories />

      <section className="mx-auto mt-10 max-w-[1320px] px-6">
        <div className="rounded-2xl bg-[#06142d] p-7 text-white shadow-xl md:flex md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <span className="text-6xl">📣</span>
            <div>
              <h2 className="text-3xl font-black text-yellow-400">
                DIVULGUE SEU NEGÓCIO
              </h2>
              <p>Apareça para milhares de pessoas do seu bairro.</p>
            </div>
          </div>

          <a
            className="mt-5 inline-block rounded-xl bg-yellow-400 px-8 py-4 font-black text-slate-950 md:mt-0"
            href="/revista/temaquinobairro/anuncie"
          >
            Anuncie Agora!
          </a>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-[1320px] px-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-3xl font-black text-slate-950">
            Destaques do bairro
          </h2>

          <a
            className="font-bold text-red-600"
            href="/revista/temaquinobairro/bairros/jd-rodolfo-pirani"
          >
            Ver todos →
          </a>
        </div>

        <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-5">
          {empresas.map((e) => (
            <EmpresaCard key={e.nome} empresa={e} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-[1320px] gap-5 px-6 pb-16 md:grid-cols-3">
        {promocoes.map((p) => (
          <div
            key={p.titulo}
            className={`${p.cor} rounded-2xl p-8 text-white shadow-xl`}
          >
            <p className="text-lg font-bold">{p.titulo}</p>
            <h3 className="mt-2 text-4xl font-black">{p.texto}</h3>
          </div>
        ))}
      </section>
    </main>
  )
}