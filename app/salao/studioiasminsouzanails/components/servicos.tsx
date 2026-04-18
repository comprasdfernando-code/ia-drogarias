const servicos = [
  { nome: "Alongamento em Gel", preco: "R$ 150" },
  { nome: "Fibra de Vidro", preco: "R$ 180" },
  { nome: "Blindagem", preco: "R$ 90" },
  { nome: "Manutenção", preco: "R$ 100" },
];

export default function Servicos() {
  return (
    <section id="servicos" className="relative px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <p className="text-xs tracking-[0.45em] text-[#d4af37]">SERVIÇOS</p>
          <h2 className="mt-3 text-3xl font-light text-white md:text-4xl">
            Beleza com acabamento premium
          </h2>
        </div>

        <div className="grid gap-5">
          {servicos.map((s) => (
            <div
              key={s.nome}
              className="group rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/25"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-lg text-zinc-100 md:text-2xl">
                  {s.nome}
                </span>
                <span className="rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-4 py-2 text-base font-semibold text-[#f1cc63] md:text-xl">
                  {s.preco}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}