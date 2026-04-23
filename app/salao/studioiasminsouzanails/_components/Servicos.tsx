const servicosPrincipais = [
  { nome: "Alongamento Molde F1", preco: "R$ 180,00" },
  { nome: "Manutenção Molde F1", preco: "R$ 120,00" },
  { nome: "Banho de Gel", preco: "R$ 120,00" },
  { nome: "Manutenção Banho de Gel", preco: "R$ 110,00" },
  { nome: "Esmaltação em Gel", preco: "R$ 95,00" },
];

const decoracoes = [
  { nome: "Decoração Simples", preco: "R$ 25,00" },
  { nome: "Decoração Média", preco: "R$ 35,00" },
  { nome: "Decoração Avançada", preco: "R$ 50,00" },
];

export default function Servicos() {
  return (
    <section id="servicos" className="relative px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="text-xs tracking-[0.45em] text-[#d4af37]">TABELA DE VALORES</p>
          <h2 className="mt-3 text-3xl font-light text-white md:text-4xl">
            Serviços e valores
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
            Confira os principais serviços disponíveis no studio, com valores
            atualizados.
          </p>
        </div>

        <div className="grid gap-12">
          <div>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h3 className="text-xl font-light text-white md:text-2xl">
                Serviços principais
              </h3>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid gap-5">
              {servicosPrincipais.map((s) => (
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

          <div>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h3 className="text-xl font-light text-white md:text-2xl">
                Decoração adicional
              </h3>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {decoracoes.map((item) => (
                <div
                  key={item.nome}
                  className="rounded-[24px] border border-[#d4af37]/15 bg-[linear-gradient(180deg,rgba(212,175,55,0.10),rgba(255,255,255,0.03))] p-5 text-center shadow-[0_10px_40px_rgba(0,0,0,0.20)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/30"
                >
                  <p className="text-lg text-white md:text-xl">{item.nome}</p>
                  <p className="mt-3 text-2xl font-semibold text-[#f1cc63]">
                    {item.preco}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[24px] border border-pink-200/10 bg-white/5 px-6 py-5 text-center shadow-[0_10px_30px_rgba(0,0,0,0.20)]">
              <p className="text-sm tracking-[0.25em] text-[#d4af37]">
                OBSERVAÇÃO
              </p>
              <p className="mt-3 text-base text-zinc-300 md:text-lg">
                Adereço para unhas será cobrado por unidade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}