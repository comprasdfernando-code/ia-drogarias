import Header from '../components/Header'
import EmpresaCard from '../components/EmpresaCard'
import { supabase } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: { q?: string; bairro?: string }
}) {
  const q = searchParams.q || ''
  const bairro = searchParams.bairro || ''

  let query = supabase
    .from('tab_empresas')
    .select('*')
    .eq('ativo', true)
    .order('premium', { ascending: false })
    .order('destaque', { ascending: false })
    .order('nome', { ascending: true })

  if (bairro) {
    query = query.ilike('bairro', `%${bairro}%`)
  }

  if (q) {
    query = query.or(
      `nome.ilike.%${q}%,categoria.ilike.%${q}%,descricao.ilike.%${q}%`
    )
  }

  const { data: empresas, error } = await query

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <section className="mx-auto max-w-[1320px] px-6 py-10">
        <h1 className="text-4xl font-black text-slate-950">
          Resultado da busca
        </h1>

        <p className="mt-2 text-slate-600">
          Bairro: <b>{bairro || 'Todos'}</b> • Busca: <b>{q || 'Todas'}</b>
        </p>

        {error && (
          <p className="mt-6 rounded-xl bg-red-100 p-4 font-bold text-red-700">
            Erro ao buscar empresas.
          </p>
        )}

        <div className="mt-8 grid gap-5 md:grid-cols-3 lg:grid-cols-5">
          {(empresas || []).map((empresa) => (
            <EmpresaCard key={empresa.id} empresa={empresa} />
          ))}
        </div>

        {empresas?.length === 0 && (
          <div className="mt-10 rounded-2xl bg-white p-8 text-center shadow">
            <h2 className="text-2xl font-black">
              Nenhum comércio encontrado
            </h2>
            <p className="mt-2 text-slate-500">
              Tente outro bairro ou categoria.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}