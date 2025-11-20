// app/turismo/mundoverdetour/components/Servicos.tsx
const cards = [
  {
    titulo: "Uber Turístico em Monte Verde",
    desc: "Chamadas rápidas para se locomover com segurança entre pousadas, restaurantes e pontos turísticos.",
    icon: "🚗",
  },
  {
    titulo: "City Tour Completo",
    desc: "Roteiro guiado pelos principais pontos de Monte Verde: mirantes, centros comerciais e atrações naturais.",
    icon: "🌄",
  },
  {
    titulo: "Passeios Personalizados",
    desc: "Montamos o passeio do seu jeito: romântico, em família, aventura, compras ou gastronômico.",
    icon: "💚",
  },
  {
    titulo: "Transfer de Aeroporto",
    desc: "Transfer de/para aeroportos e cidades da região, com todo conforto e pontualidade.",
    icon: "🛬",
  },
];

export default function Servicos() {
  return (
    <section
      id="servicos"
      className="bg-white py-14 md:py-20 border-y border-green-100"
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-green-900">
              Serviços & Passeios
            </h2>
            <p className="text-slate-600 mt-1">
              Tudo o que você precisa para aproveitar Monte Verde com
              tranquilidade.
            </p>
          </div>
          <a
            href="#contato"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-600 text-green-700 text-sm font-semibold hover:bg-green-50"
          >
            📲 Pedir orçamento pelo WhatsApp
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {cards.map((card) => (
            <div
              key={card.titulo}
              className="rounded-2xl border border-green-100 bg-gradient-to-br from-white to-green-50/40 p-5 shadow-sm"
            >
              <div className="text-2xl mb-2">{card.icon}</div>
              <h3 className="font-semibold text-green-900 mb-1">
                {card.titulo}
              </h3>
              <p className="text-sm text-slate-700">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}