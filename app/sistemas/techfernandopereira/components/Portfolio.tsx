"use client";

import Animated from "@/components/Animated";

const projects = [
  {
    title: "IA Drogarias",
    desc: "Marketplace + sistema completo de gestão e automação para farmácias.",
    link: "/drogarias/drogariaredefabiano",
  },
  {
    title: "Gigante dos Assados",
    desc: "Sistema de PDV, controle de vendas e operação completa do restaurante.",
    link: "/gigante",
  },
  {
    title: "Mundo Verde Tour",
    desc: "Site institucional + painel administrativo para gestão de passeios.",
    link: "/turismo/mundoverdetour",
  },
];

export default function Portfolio() {
  return (
    <section className="w-full py-24 px-6 bg-[#070B11]">
      <div className="max-w-6xl mx-auto">

        <Animated>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Portfólio
          </h2>
        </Animated>

        <div className="grid md:grid-cols-3 gap-8">
          {projects.map((p, i) => (
            <Animated key={i}>
              <a
                href={p.link}
                className="block border border-gray-700 bg-[#0A0F16] p-6 rounded-xl
                       hover:border-blue-500 hover:shadow-xl hover:shadow-blue-900/20
                       transition-all duration-300"
              >
                <h3 className="text-xl font-semibold mb-2">{p.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
              </a>
            </Animated>
          ))}
        </div>

      </div>
    </section>
  );
}
