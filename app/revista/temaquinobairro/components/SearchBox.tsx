'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const base = '/revista/temaquinobairro'

export default function SearchBox({
  bairro = 'Jd. Rodolfo Pirani',
}: {
  bairro?: string
}) {
  const router = useRouter()
  const params = useSearchParams()

  const [q, setQ] = useState(params.get('q') || '')
  const [bairroSelecionado, setBairroSelecionado] = useState(
    params.get('bairro') || bairro
  )

  const bairros = [
    'Jd. Rodolfo Pirani',
    'Baeta Neves',
    'Jardim Esther',
    'Vila Bela',
  ]

  function buscar() {
    const query = new URLSearchParams()

    if (q) query.set('q', q)
    if (bairroSelecionado) query.set('bairro', bairroSelecionado)

    router.push(`${base}/buscar?${query.toString()}`)
  }

  return (
    <div className="relative z-30 mx-auto -mt-20 max-w-[1320px] px-4">
      <div className="rounded-3xl bg-white p-4 shadow-2xl">
        <div className="grid gap-3 md:grid-cols-[1fr_260px_160px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar comércio ou serviço"
            className="rounded-2xl border p-4 font-bold"
          />

          <select
            value={bairroSelecionado}
            onChange={(e) => setBairroSelecionado(e.target.value)}
            className="rounded-2xl border p-4 font-bold"
          >
            {bairros.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>

          <button
            onClick={buscar}
            className="rounded-2xl bg-red-600 p-4 font-black text-white"
          >
            Buscar
          </button>
        </div>
      </div>
    </div>
  )
}