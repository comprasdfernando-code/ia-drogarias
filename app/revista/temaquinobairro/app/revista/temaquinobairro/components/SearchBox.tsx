export default function SearchBox({ bairro = 'Selecione seu bairro' }: { bairro?: string }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-3 rounded-2xl bg-white p-4 shadow-2xl md:grid-cols-[1.4fr_1fr_auto_auto]">
      <label className="flex items-center gap-3 rounded-xl border px-4 py-3">
        <span className="text-2xl">🔎</span>
        <span className="w-full">
          <span className="block text-xs text-slate-500">O que você procura?</span>
          <input className="w-full outline-none" placeholder="Ex: farmácia, pizzaria, mecânico..." />
        </span>
      </label>
      <label className="flex items-center gap-3 rounded-xl border px-4 py-3">
        <span className="text-2xl">📍</span>
        <span className="w-full">
          <span className="block text-xs text-slate-500">Qual bairro?</span>
          <input className="w-full outline-none" defaultValue={bairro} />
        </span>
      </label>
      <button className="rounded-xl bg-red-600 px-8 py-3 font-bold text-white hover:bg-red-700">Buscar</button>
      <button className="rounded-xl border px-5 py-3 font-bold text-slate-700 hover:bg-slate-50">Usar localização</button>
    </div>
  );
}
