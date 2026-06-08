import { categorias } from './data';

export default function Categorias() {
  return (
    <section className="mx-auto mt-8 grid max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-4 lg:grid-cols-8">
      {categorias.map((cat) => (
        <button key={cat.slug} className="rounded-2xl bg-white p-5 text-center shadow hover:-translate-y-1 hover:shadow-xl transition">
          <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${cat.cor} text-2xl text-white`}>{cat.icone}</span>
          <span className="mt-3 block text-sm font-bold text-slate-800">{cat.nome}</span>
        </button>
      ))}
    </section>
  );
}
