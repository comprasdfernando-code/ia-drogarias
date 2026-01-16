// components/ServiceCards.tsx
export default function ServiceCards() {
  const itens = [
    {
      titulo: "Auto Elétrica",
      desc: "Bateria, alternador, partida, iluminação, chicote e diagnósticos.",
      tag: "Rápido e confiável",
    },
    {
      titulo: "Som Automotivo",
      desc: "Instalação, upgrades, alto-falantes, módulos e ajustes finos.",
      tag: "Som forte e limpo",
    },
    {
      titulo: "Acessórios",
      desc: "Palhetas, lâmpadas, carregadores, suportes e itens de carro.",
      tag: "Pronto pra levar",
    },
    {
      titulo: "Conveniência",
      desc: "Café, bebidas e itens rápidos enquanto seu carro é atendido.",
      tag: "Parou, resolveu",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h2 className="text-xl font-extrabold tracking-wide">
        Serviços <span className="text-yellow-400">Ninho Car</span>
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        Tudo em um só lugar: seu carro + sua conveniência.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {itens.map((i) => (
          <div
            key={i.titulo}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-extrabold">{i.titulo}</h3>
              <span className="rounded-full bg-yellow-400/15 px-2 py-1 text-[11px] font-bold text-yellow-300">
                {i.tag}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-300">{i.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
