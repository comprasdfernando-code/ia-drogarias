import Header from '../components/Header';

const planos = [
  ['Gratuito', 'R$ 0', 'Nome, categoria, telefone e bairro'],
  ['Destaque', 'R$ 29,90/mês', 'Aparece melhor nas buscas'],
  ['Premium', 'R$ 59,90/mês', 'Perfil completo, fotos, promoções e WhatsApp'],
  ['Capa / Banner', 'R$ 149,90/mês', 'Destaque na home, bairro e revista digital'],
];

export default function AnunciePage() {
  return <main className="min-h-screen bg-slate-50"><Header /><section className="mx-auto max-w-7xl px-4 py-10"><h1 className="text-4xl font-black">Anuncie no Tem Aqui No Bairro</h1><p className="mt-4 text-lg text-slate-600">Divulgue seu comércio para quem mora perto e já procura pelo seu serviço.</p><div className="mt-8 grid gap-5 md:grid-cols-4">{planos.map(([nome, preco, desc]) => <div key={nome} className="rounded-2xl bg-white p-6 shadow"><h2 className="text-2xl font-black">{nome}</h2><p className="mt-3 text-2xl font-black text-red-600">{preco}</p><p className="mt-3 text-slate-600">{desc}</p><button className="mt-6 w-full rounded-xl bg-red-600 px-4 py-3 font-black text-white">Quero anunciar</button></div>)}</div></section></main>;
}
