// app/turismo/mundoverdetour/components/Servicos.tsx
const cards = [
  {
    titulo: "City Tour Completo",
    desc: "Passeio pelos principais pontos de Monte Verde: centro turístico, mirantes, lojas e cenários instagramáveis.",
    icon: "🌄",
  },
  {
    titulo: "Passeios Personalizados",
    desc: "Roteiro feito sob medida: romântico, família, aventura, gastronômico ou focado em natureza.",
    icon: "💚",
  },
  {
    titulo: "Uber Turístico",
    desc: "Transporte porta a porta entre pousadas, restaurantes, trilhas e atrativos da região.",
    icon: "🚗",
  },
  {
    titulo: "Quadriciclo & Aventura",
    desc: "Experiências off-road com quadriciclos e vistas incríveis da Serra da Mantiqueira.",
    icon: "🏍️",
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
            <h2 className="text-2xl md:text-3xl font-bold text-[#3C532B]">
              Passeios & Serviços
            </h2>
            <p className="text-slate-600 mt-1">
              Tudo o que você precisa para aproveitar Monte Verde com
              tranquilidade e segurança.
            </p>
          </div>
          <a
            href="#contato"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#7A8C43] text-[#3C532B] text-sm font-semibold hover:bg-green-50"
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
              <h3 className="font-semibold text-[#3C532B] mb-1">
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