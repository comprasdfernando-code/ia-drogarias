'use client'

import { useState } from 'react'
import Header from '../components/Header'
import { supabase } from '@/lib/supabaseClient'

export default function CadastroEmpresa() {
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)

  async function cadastrar(e: any) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)

    const data = {
      nome: form.get('nome'),
      categoria: form.get('categoria'),
      bairro: form.get('bairro'),
      cidade: form.get('cidade') || 'São Paulo',
      estado: form.get('estado') || 'SP',
      whatsapp: form.get('whatsapp'),
      telefone: form.get('telefone'),
      endereco: form.get('endereco'),
      instagram: form.get('instagram'),
      site: form.get('site'),
      descricao: form.get('descricao'),
      consultor_nome: form.get('consultor_nome'),
      consultor_whatsapp: form.get('consultor_whatsapp'),
      indicado_por: form.get('indicado_por'),
      plano: 'gratis',
      status: 'pendente',
      ativo: false,
      destaque: false,
      premium: false,
    }

    const { error } = await supabase.from('tab_empresas').insert([data])

    setLoading(false)

    if (!error) {
      setOk(true)
      e.currentTarget.reset()
    } else {
      alert('Erro ao cadastrar. Verifique os dados.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <section className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-black text-slate-950">
          Cadastrar comércio
        </h1>

        <p className="mt-2 text-slate-600">
          Cadastre uma empresa em poucos minutos. O cadastro será analisado antes de aparecer no site.
        </p>

        {ok && (
          <div className="mt-6 rounded-xl bg-green-100 p-4 font-bold text-green-700">
            Cadastro enviado com sucesso! Agora aguarde aprovação.
          </div>
        )}

        <form onSubmit={cadastrar} className="mt-8 grid gap-4 rounded-3xl bg-white p-6 shadow">
          <input name="nome" required placeholder="Nome da empresa" className="rounded-xl border p-4" />

          <select name="categoria" required className="rounded-xl border p-4">
            <option value="">Categoria</option>
            <option>Farmácia</option>
            <option>Alimentação</option>
            <option>Beleza e Estética</option>
            <option>Auto Elétrico</option>
            <option>Sorveteria</option>
            <option>Pet Shop</option>
            <option>Mercado</option>
            <option>Serviços</option>
          </select>

          <input name="bairro" required placeholder="Bairro" className="rounded-xl border p-4" />

          <div className="grid gap-4 md:grid-cols-2">
            <input name="cidade" placeholder="Cidade" className="rounded-xl border p-4" />
            <input name="estado" placeholder="Estado" defaultValue="SP" className="rounded-xl border p-4" />
          </div>

          <input name="whatsapp" placeholder="WhatsApp da empresa" className="rounded-xl border p-4" />
          <input name="telefone" placeholder="Telefone" className="rounded-xl border p-4" />
          <input name="endereco" placeholder="Endereço" className="rounded-xl border p-4" />
          <input name="instagram" placeholder="Instagram" className="rounded-xl border p-4" />
          <input name="site" placeholder="Site ou página pronta" className="rounded-xl border p-4" />

          <textarea name="descricao" placeholder="Descrição curta da empresa" className="rounded-xl border p-4" />

          <h2 className="pt-4 text-xl font-black">Indicação / Consultor</h2>

          <input name="consultor_nome" placeholder="Nome do consultor" className="rounded-xl border p-4" />
          <input name="consultor_whatsapp" placeholder="WhatsApp do consultor" className="rounded-xl border p-4" />
          <input name="indicado_por" placeholder="Indicado por" className="rounded-xl border p-4" />

          <button
            disabled={loading}
            className="rounded-xl bg-red-600 p-4 font-black text-white hover:bg-red-700"
          >
            {loading ? 'Enviando...' : 'Enviar cadastro'}
          </button>
        </form>
      </section>
    </main>
  )
}