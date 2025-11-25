"use client";

export default function Sobre() {
  return (
    <section
      id="sobre"
      className="w-full py-24 px-6 bg-[#05070A] border-t border-white/5"
    >
      <div className="max-w-5xl mx-auto text-center">

        {/* TÍTULO */}
        <h2 className="text-3xl md:text-5xl font-bold mb-8">
          Sobre Mim
        </h2>

        {/* TEXTO */}
        <p className="text-gray-300 text-lg leading-relaxed max-w-3xl mx-auto">
          Meu nome é <span className="font-semibold text-white">Fernando Pereira</span>.
          Sou desenvolvedor fullstack especializado em criar sistemas inteligentes,
          sites modernos e soluções digitais que ajudam empresas a vender mais,
          organizar seus processos e crescer de verdade.
          <br /><br />
          Tenho experiência com automação comercial, PDV, integração com bancos de dados,
          Supabase, ERP, dashboards, e construção de interfaces profissionais.
          Já desenvolvi sistemas completos para setores como alimentação, turismo,
          advocacia, saúde, auto elétrica e comércio local.
          <br /><br />
          Meu foco sempre foi entregar tecnologia de forma simples, eficiente
          e acessível — para o empresário que precisa resolver problemas reais,
          e não complicar a vida com sistemas difíceis ou caros demais.
        </p>

        {/* FRASE FINAL */}
        <p className="text-gray-400 mt-8 italic">
          “Tecnologia prática, inteligente e feita sob medida para cada cliente.”
        </p>

      </div>
    </section>
  );
}
