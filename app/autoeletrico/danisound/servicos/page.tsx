import Image from "next/image";

export default function ServicosDaniSound() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-20 text-white">

      {/* TÍTULO */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold neon-red">Serviços Profissionais</h1>
        <p className="text-zinc-300 max-w-2xl mx-auto text-sm">
          Do básico ao avançado: elétrica, multimídia, LED, alarmes, rastreadores,
          acessórios e muito mais. Instalações sempre com acabamento premium.
        </p>
      </div>

      {/* GRID DE SERVIÇOS */}
      <section className="grid md:grid-cols-3 gap-8">
        {[
          {
            icon: "🔧",
            title: "Elétrica Automotiva",
            desc: "Alternador, motor de partida, curto elétrico, chicote, fusíveis, relês, testes e diagnósticos.",
            img: "/danisound/car-led.jpg",
          },
          {
            icon: "🔊",
            title: "Som Automotivo",
            desc: "Alto-falantes, módulos, subwoofer, caixas, tratamento acústico e instalação limpa.",
            img: "/danisound/falante-hurricane.jpg",
          },
          {
            icon: "💡",
            title: "Iluminação & LED",
            desc: "Super LED, farol, milha, DRL, angel eyes, iluminação interna e externa.",
            img: "/danisound/led-s14.jpg",
          },
          {
            icon: "🎛️",
            title: "Multimídia Premium",
            desc: "Centrais Android, Tesla screen, molduras, câmera de ré, TV digital e entradas USB.",
            img: "/danisound/depois-kia.jpg",
          },
          {
            icon: "🔐",
            title: "Alarmes & Segurança",
            desc: "Alarmes, trava elétrica, bloqueador, atuadores, travas de porta e sensores.",
            img: "/danisound/alarme.jpg",
          },
          {
            icon: "📡",
            title: "Acessórios",
            desc: "Antenas internas, controles, câmeras, sensores de ré, carregadores e cabos.",
            img: "/danisound/antena-lookout.jpg",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="card-premium-dark rounded-xl overflow-hidden hover:border-red-700/50 transition"
          >
            <div className="relative h-40 w-full">
              <Image
                src={item.img}
                alt={item.title}
                fill
                className="object-cover img-neon"
              />
            </div>

            <div className="p-5 space-y-2">
              <div className="text-4xl">{item.icon}</div>
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="text-sm text-zinc-300">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* PORQUE ESCOLHER O DANI SOUND */}
      <section className="card-premium-dark p-8 space-y-6">
        <h2 className="text-3xl font-semibold text-center neon-red">
          Por que escolher o Dani Sound?
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h4 className="font-semibold text-white">Acabamento Profissional</h4>
            <p className="text-sm text-zinc-300 mt-2">
              Instalações limpas, sem cortes desnecessários e sem gambiarra.
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-3">🔧</div>
            <h4 className="font-semibold text-white">Experiência Real</h4>
            <p className="text-sm text-zinc-300 mt-2">
              Anos de experiência com elétrica, multimídia, LED e som automotivo.
            </p>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-3">📍</div>
            <h4 className="font-semibold text-white">Local de Fácil Acesso</h4>
            <p className="text-sm text-zinc-300 mt-2">
              Atendimento rápido na Av. Rodolfo Pirani — Zona Leste, SP.
            </p>
          </div>
        </div>
      </section>

      {/* BOTÃO WHATSAPP */}
      <div className="text-center mt-10">
        <a
          href="https://wa.me/5511977844066?text=Olá,+quero+um+orçamento+para+meu+carro!"
          target="_blank"
          className="btn-neon inline-block text-white px-8 py-4 rounded-full text-lg"
        >
          Pedir orçamento agora
        </a>
      </div>
    </div>
  );
}
