import Animated from "@/components/Animated";

export default function Sobre() {
  return (
    <section className="w-full py-24 px-6 bg-[#070B11]">
      <Animated>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Sobre mim
          </h2>

          <p className="text-gray-300 text-lg leading-relaxed max-w-3xl mx-auto">
            Sou Fernando Pereira, desenvolvedor fullstack especializado em
            soluções para negócios. Desenvolvo sites, sistemas, automações
            e integrações inteligentes para empresas que desejam crescer,
            se modernizar e ter mais controle do seu negócio.
            <br /><br />
            Meu foco é entregar tecnologia simples, direta e eficiente —
            sem complicação, sem enrolação. Apenas soluções que funcionam.
          </p>
        </div>
      </Animated>
    </section>
  );
}
