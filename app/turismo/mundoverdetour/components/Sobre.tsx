// app/turismo/mundoverdetour/components/Sobre.tsx
export default function Sobre() {
  return (
    <section
      id="sobre"
      className="max-w-5xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center"
    >
      <div className="space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-green-900">
          Quem é a <span className="text-green-700">Mundo Verde Tour</span>?
        </h2>
        <p className="text-slate-700 leading-relaxed">
          A Mundo Verde Tour é uma agência especializada em{" "}
          <strong>eco turismo em Monte Verde (MG)</strong>, oferecendo passeios
          personalizados, city tour, transfer de aeroporto e transporte tipo
          “Uber turístico”. Nosso objetivo é proporcionar{" "}
          <strong>conforto, segurança e experiências únicas</strong> na Serra
          da Mantiqueira.
        </p>
        <p className="text-slate-700 leading-relaxed">
          Atendemos casais, famílias e grupos que querem viver o melhor da{" "}
          <strong>Suíça Mineira</strong>: natureza, gastronomia, clima
          romântico e aquele friozinho gostoso que só Monte Verde tem.
        </p>
      </div>

      <div className="rounded-3xl border border-green-100 bg-white shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-green-800">
          Por que escolher a Mundo Verde Tour?
        </h3>
        <ul className="space-y-2 text-slate-700 text-sm md:text-base">
          <li>✅ Motoristas experientes e veículos confortáveis</li>
          <li>✅ Roteiros personalizados de acordo com seu perfil</li>
          <li>✅ Atendimento próximo, humanizado e via WhatsApp</li>
          <li>✅ Conhecimento local: dicas de restaurantes, passeios e hotéis</li>
        </ul>
      </div>
    </section>
  );
}