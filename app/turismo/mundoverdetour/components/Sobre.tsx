// app/turismo/mundoverdetour/components/Sobre.tsx
export default function Sobre() {
  return (
    <section
      id="sobre"
      className="max-w-5xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center"
    >
      <div className="space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#3C532B]">
          Conheça a{" "}
          <span className="text-[#7A8C43]">Mundo Verde Tour</span>
        </h2>
        <p className="text-slate-700 leading-relaxed">
          A Mundo Verde Tour é uma agência de <strong>eco turismo</strong>{" "}
          especializada em Monte Verde (MG). Oferecemos{" "}
          <strong>city tour completo</strong>,{" "}
          <strong>passeios personalizados</strong> e{" "}
          <strong>transporte tipo Uber</strong>, conectando você às melhores
          experiências na Serra da Mantiqueira.
        </p>
        <p className="text-slate-700 leading-relaxed">
          Atendemos casais, famílias e grupos que querem viver o melhor da{" "}
          <strong>Suíça Mineira</strong>: paisagens, friozinho gostoso,
          gastronomia e muitos momentos inesquecíveis.
        </p>
      </div>

      <div className="rounded-3xl border border-green-100 bg-white shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-[#3C532B]">
          Por que viajar com a Mundo Verde Tour?
        </h3>
        <ul className="space-y-2 text-slate-700 text-sm md:text-base">
          <li>✅ Motoristas experientes e veículos confortáveis</li>
          <li>✅ Roteiros pensados para o seu estilo de viagem</li>
          <li>✅ Atendimento humanizado e direto pelo WhatsApp</li>
          <li>✅ Dicas locais de restaurantes, cafés e passeios</li>
        </ul>
      </div>
    </section>
  );
}