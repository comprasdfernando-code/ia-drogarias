"use client";

const services = [
  {
    title: "Desenvolvimento de Sites",
    desc: "Sites modernos, responsivos e rápidos para empresas que querem presença forte online.",
  },
  {
    title: "Sistemas Personalizados",
    desc: "Sistemas completos sob medida: PDV, ERPs, dashboards, admin panels e automações.",
  },
  {
    title: "Automação Comercial",
    desc: "Integração de processos, cálculo automático, planilhas inteligentes e ferramentas para o dia a dia.",
  },
  {
    title: "Painéis Administrativos",
    desc: "Criação de painéis profissionais com Supabase, gráficos, relatórios e controle total dos dados.",
  },
  {
    title: "Landing Pages que Vendem",
    desc: "Páginas profissionais otimizadas para conversão e captação de clientes.",
  },
  {
    title: "Integrações com WhatsApp",
    desc: "Formulários, botões, mensagens automáticas e integrações com sistemas.",
  },
  {
    title: "Consultoria Tech",
    desc: "Análise do negócio, criação de soluções digitais e modernização tecnológica.",
  },
];

export default function Services() {
  return (
    <section
      id="services"
      className="w-full py-24 px-6 bg-[#05070A] border-t border-white/5"
    >
      <div className="max-w-6xl mx-auto">

        <h2 className="text-3xl md:text-5xl font-bold text-center mb-14">
          Serviços
        </h2>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <div
              key={i}
              className="bg-[#0A0F16] border border-gray-800 rounded-xl p-6 
                         hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10
                         transition-all duration-300"
            >
              <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
