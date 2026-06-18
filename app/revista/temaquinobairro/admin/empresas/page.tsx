'use client'

import { useEffect, useState } from 'react'
import Header from '../../components/Header'
import { supabase } from '@/lib/supabaseClient'

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function carregar() {
    setLoading(true)

    const { data, error } = await supabase
      .from('tab_empresas')
      .select('*')
      .order('criado_em', { ascending: false })

    if (!error) setEmpresas(data || [])

    setLoading(false)
  }

  async function atualizar(id: string, campo: string, valor: any) {
    const { error } = await supabase
      .from('tab_empresas')
      .update({ [campo]: valor })
      .eq('id', id)

    if (!error) carregar()
  }

  async function plano(id: string, novoPlano: string) {
    const premium = novoPlano === 'premium' || novoPlano === 'banner'
    const destaque = novoPlano === 'destaque' || novoPlano === 'premium' || novoPlano === 'banner'

    const { error } = await supabase
      .from('tab_empresas')
      .update({
        plano: novoPlano,
        premium,
        destaque,
      })
      .eq('id', id)

    if (!error) carregar()
  }

  useEffect(() => {
    carregar()
  }, [])

  return (
    <main className="min-h-screen bg-slate-100">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-950">
            Gerenciar cadastros
          </h1>
          <p className="text-slate-600">
            Ative, desative e gerencie os comércios cadastrados.
          </p>
        </div>

        {loading && <p>Carregando...</p>}

        <div className="grid gap-4">
          {empresas.map((e) => (
            <div
              key={e.id}
              className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200"
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_260px] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-slate-950">
                      {e.nome}
                    </h2>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">
                      {e.status}
                    </span>

                    {e.ativo && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                        ATIVO
                      </span>
                    )}

                    {e.premium && (
                      <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-slate-950">
                        PREMIUM
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {e.categoria} • {e.bairro} • {e.cidade}/{e.estado}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    WhatsApp: {e.whatsapp || 'não informado'}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Consultor: {e.consultor_nome || 'não informado'} • Indicado por: {e.indicado_por || 'não informado'}
                  </p>
                </div>

                <div className="grid gap-2">
                  <button
                    onClick={() => atualizar(e.id, 'ativo', !e.ativo)}
                    className={`rounded-xl px-4 py-3 font-black text-white ${
                      e.ativo ? 'bg-slate-700' : 'bg-green-600'
                    }`}
                  >
                    {e.ativo ? 'Desativar' : 'Ativar'}
                  </button>

                  <select
                    value={e.plano || 'gratis'}
                    onChange={(ev) => plano(e.id, ev.target.value)}
                    className="rounded-xl border p-3 font-bold"
                  >
                    <option value="gratis">Grátis</option>
                    <option value="destaque">Destaque</option>
                    <option value="premium">Premium</option>
                    <option value="banner">Banner</option>
                  </select>

                  <button
                    onClick={() => atualizar(e.id, 'status', 'bloqueado')}
                    className="rounded-xl border border-red-200 px-4 py-3 font-black text-red-600"
                  >
                    Bloquear
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}