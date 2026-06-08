export default function SearchBox({ bairro = 'Selecione seu bairro' }: { bairro?: string }) {
  return (
    <div className="mx-auto -mt-10 grid max-w-6xl gap-3 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 md:grid-cols-[1.4fr_1fr_auto_auto]">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
        <span className="text-3xl">🔎</span>
        <div><p className="text-xs text-slate-500">O que você procura?</p><input className="w-full outline-none" placeholder="Ex: Farmácia, Pizzaria, Mecânico, Pet Shop..." /></div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
        <span className="text-3xl">📍</span>
        <div><p className="text-xs text-slate-500">Qual bairro?</p><input className="w-full font-semibold outline-none" defaultValue={bairro} /></div>
      </div>
      <button className="rounded-xl bg-red-600 px-10 py-4 font-black text-white shadow-lg hover:bg-red-700">Buscar</button>
      <button className="rounded-xl border border-slate-200 px-5 py-4 text-sm font-bold text-slate-700">Usar localização</button>
    </div>
  )
}
