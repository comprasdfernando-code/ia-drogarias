import Header from '../components/Header';

export default function RevistaPage() {
  return <main className="min-h-screen bg-slate-50"><Header /><section className="mx-auto max-w-5xl px-4 py-10"><h1 className="text-4xl font-black">Revista Tem Aqui No Bairro</h1><p className="mt-4 text-lg text-slate-600">Aqui entram as edições digitais em PDF, matérias dos comerciantes, eventos e destaques da comunidade.</p><div className="mt-8 rounded-3xl bg-white p-8 shadow"><h2 className="text-2xl font-black">Edição 01</h2><p className="mt-2 text-slate-600">Jd. Rodolfo Pirani e região — comércios, serviços, saúde, alimentação e oportunidades.</p></div></section></main>;
}
