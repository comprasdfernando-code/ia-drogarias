export default function Landing() {
  return (
    <div className="min-h-screen bg-[#05070A] text-white">

      {/* HERO */}
      <section className="text-center py-24 px-6">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          Soluções Digitais Para Sua Loja
        </h1>

        <p className="text-gray-300 max-w-2xl mx-auto mt-6 text-lg">
          Sites, sistemas, catálogos, PDV, delivery e automações pensadas para
          pequenos comerciantes: mercado, açougue, padaria, sorveteria,
          auto elétrica, turismo, farmácia e muito mais.
        </p>

        <a
          href="https://wa.me/5511964819472"
          className="mt-10 inline-block px-10 py-4 bg-blue-600 hover:bg-blue-700 
                     rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg"
        >
          Falar no WhatsApp
        </a>
      </section>

      {/* SOBRE RÁPIDO */}
      <section className="border-t border-white/10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Quem Vai Criar Seu Sistema?</h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            Meu nome é <span className="font-semibold text-white">Fernando Pereira</span>,
            desenvolvedor especializado em soluções para pequenos negócios.
            Já construí sites e sistemas para áreas como alimentação, auto elétrica,
            turismo, advocacia e saúde.
            <br /><br />
            Eu entendo a realidade do pequeno comerciante e entrego tecnologia
            prática, acessível e que realmente ajuda seu negócio a crescer.
          </p>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="border-t border-white/10 py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-14">O Que Posso Fazer Pela Sua Loja</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              "Site Profissional",
              "Sistema de Vendas / PDV",
              "Dashboard de Controle",
              "Delivery e Catálogo Online",
              "Automação Comercial",
              "Landing Page de Vendas",
            ].map((s, i) => (
              <div
                key={i}
                className="bg-[#0A0F16] p-6 rounded-xl border border-gray-800
                           hover:border-blue-500 transition-all duration-300"
              >
                <p className="text-gray-200 text-lg font-semibold">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFÓLIO */}
      <section className="border-t border-white/10 py-20 px-6">
        <h2 className="text-3xl font-bold text-center mb-14">Alguns Projetos</h2>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">


          <div className="bg-[#0A0F16] p-6 rounded-xl border border-gray-800 hover:border-blue-500 transition">
            <h3 className="text-xl font-semibold">Gigante dos Assados</h3>
            <p className="text-gray-400 text-sm mt-2">PDV completo + site</p>
          </div>

          <div className="bg-[#0A0F16] p-6 rounded-xl border border-gray-800 hover:border-blue-500 transition">
            <h3 className="text-xl font-semibold">Mundo Verde Tour</h3>
            <p className="text-gray-400 text-sm mt-2">Site + painel admin</p>
          </div>

          <div className="bg-[#0A0F16] p-6 rounded-xl border border-gray-800 hover:border-blue-500 transition">
            <h3 className="text-xl font-semibold">Dani Sound</h3>
            <p className="text-gray-400 text-sm mt-2">Site profissional</p>
          </div>

        </div>
      </section>

      {/* CTA FINAL */}
      <section className="text-center py-24 px-6 border-t border-white/10">
        <h2 className="text-3xl font-bold mb-6">
          Pronto Para Levar Sua Loja Para o Próximo Nível?
        </h2>

        <a
          href="https://wa.me/5511964819472"
          className="mt-4 inline-block px-12 py-4 bg-blue-600 hover:bg-blue-700 
                     rounded-xl text-lg font-semibold transition-all duration-300 shadow-xl"
        >
          Chamar no WhatsApp Agora
        </a>
      </section>
    </div>
  );
}
