export default function SearchBox({ bairro = 'Jd. Rodolfo Pirani' }: { bairro?: string }) {
  return (
    <div className="relative z-20 mx-auto -mt-12 grid max-w-[1080px] gap-3 rounded-2xl bg-white p-4 shadow-2xl md:grid-cols-[1.5fr_1fr_170px_190px]">
      <div className="flex items-center gap-4 rounded-xl border px-5 py-4">
        <span className="text-3xl">⌕</span>
        <div><p className="text-slate-500">O que você procura?</p><p className="text-sm text-slate-400">Ex: Farmácia, Pizzaria, Mecânico, Pet Shop...</p></div>
      </div>
      <div className="flex items-center gap-4 rounded-xl border px-5 py-4">
        <span className="text-3xl text-red-600">📍</span>
        <div><p className="text-sm text-slate-500">Qual bairro?</p><p className="font-black text-slate-950">{bairro}</p></div>
      </div>
      <button className="rounded-xl bg-red-600 px-6 py-4 text-lg font-black text-white shadow-lg hover:bg-red-700">⌕ Buscar</button>
      <button className="rounded-xl border bg-white px-5 py-3 font-black text-slate-900">◎ Usar minha localização</button>
    </div>
  )
}
