const items = [
  "Desenvolvimento de Sites Profissionais",
  "Sistemas Sob Medida",
  "PDV e ERP para Negócios",
  "Dashboards e integração com Supabase",
  "Automação Comercial",
  "Landing Pages para Empresas",
  "Integração com IA",
  "Consultoria Tecnológica"
];

export default function Services() {
  return (
    <section className="w-full py-24 px-6 bg-[#05070A]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Serviços
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, index) => (
            <div
              key={index}
              className="border border-gray-700 bg-[#0A0F16] p-6 rounded-xl 
                         hover:border-blue-500 transition"
            >
              <p className="text-gray-200">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
