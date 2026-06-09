import Header from '../../components/Header'
import SearchBox from '../../components/SearchBox'
import Categories from '../../components/Categories'
import EmpresaCard from '../../components/EmpresaCard'
import { empresas } from '../../data/mock'

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <section
        className="relative min-h-[560px] overflow-hidden text-white"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(6,18,43,.96) 0%, rgba(6,18,43,.84) 42%, rgba(6,18,43,.18) 100%), url('/bairros/jd-rodolfo-pirani.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative mx-auto max-w-[1500px] px-8 pb-28 pt-16">
          <p className="mb-10 text-sm font-semibold text-white/75">
            Início › Bairros › Jd. Rodolfo Pirani
          </p>

          <div className="max-w-4xl">
            <div className="text-5xl text-red-500">📍</div>

            <p className="mt-5 text-4xl font-light tracking-wide">
              JARDIM
            </p>

            <h1 className="mt-2 text-6xl font-black leading-none tracking-tight lg:text-8xl">
              RODOLFO PIRANI
            </h1>

            <p className="mt-5 text-4xl font-light">
              São Mateus - SP
            </p>

            <p className="mt-6 max-w-2xl text-2xl text-white/90">
              Encontre os melhores comércios, serviços, promoções e novidades perto de você.
            </p>

            <div className="mt-10 grid max-w-4xl gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white/95 p-6 text-slate-950 shadow-xl">
                <b className="text-4xl">312</b>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  Empresas cadastradas
                </p>
              </div>

              <div className="rounded-2xl bg-white/95 p-6 text-slate-950 shadow-xl">
                <b className="text-4xl">25+</b>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  Categorias locais
                </p>
              </div>

              <div className="rounded-2xl bg-white/95 p-6 text-slate-950 shadow-xl">
                <b className="text-4xl">4.8</b>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  Avaliação média
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SearchBox bairro="Jd. Rodolfo Pirani" />

      <Categories />

      <section className="mx-auto mt-8 grid max-w-[1500px] gap-6 px-6 pb-16 lg:grid-cols-[1fr_330px]">
        <div className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-200">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-black text-slate-950">
                ⭐ Destaques do bairro
              </h2>

              <p className="mt-1 font-semibold text-slate-500">
                Comércios e serviços selecionados no Jardim Rodolfo Pirani.
              </p>
            </div>

            <a className="font-black text-red-600">
              Ver todas as empresas →
            </a>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {empresas.map((e) => (
              <EmpresaCard key={e.nome} empresa={e} />
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-200">
            <h3 className="text-xl font-black text-slate-950">
              Mapa do bairro
            </h3>

            <div className="mt-4 grid h-56 place-items-center rounded-2xl bg-red-50 text-center font-black text-red-600">
              <div>
                <div className="text-5xl">📍</div>
                <p className="mt-2">Jd. Rodolfo Pirani</p>
                <p className="text-sm text-red-500">São Mateus - SP</p>
              </div>
            </div>

            <p className="mt-4 font-black text-red-600">
              Ver no Google Maps ↗
            </p>
          </div>

          <div className="rounded-3xl bg-[#06142d] p-7 text-white shadow-xl">
            <h3 className="text-2xl font-black">
              Anuncie seu negócio!
            </h3>

            <p className="mt-3 text-white/80">
              Seja encontrado por mais clientes no Jd. Rodolfo Pirani.
            </p>

            <a
              className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-4 font-black text-slate-950"
              href="/revista/temaquinobairro/anuncie"
            >
              Quero anunciar
            </a>
          </div>
        </aside>
      </section>
    </main>
  )
}