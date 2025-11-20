// app/turismo/mundoverdetour/components/TransporteDestaque.tsx
export default function TransporteDestaque() {
  return (
    <section className="bg-[#1f2933] text-white py-14 md:py-20">
      <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-[1.2fr,1fr] gap-10 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-yellow-300 mb-2">
            Uber turístico • Transfer • City tour
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
            Conforto e segurança em todos os trajetos
          </h2>
          <p className="text-sm md:text-base text-slate-100 mb-5">
            Especialistas em <strong>Uber turístico</strong>,{" "}
            <strong>transfer de aeroporto</strong>,{" "}
            <strong>city tour</strong> e{" "}
            <strong>passeios personalizados</strong>. Você escolhe o destino e
            a Mundo Verde Tour cuida do caminho.
          </p>

          <div className="rounded-2xl border border-yellow-400/70 bg-black/20 p-4 mb-4">
            <p className="text-xs text-slate-100 mb-2">
              Entre em contato e faça um orçamento:
            </p>
            <div className="flex flex-col gap-1 text-sm font-semibold">
              <span>📞 (11) 94864-4843</span>
              <span>📞 (35) 99233-5194</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://wa.me/5511948644843?text=Ola%21+Gostaria+de+um+orcamento+de+transporte+em+Monte+Verde+com+a+Mundo+Verde+Tour."
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-full bg-yellow-400 text-slate-900 font-semibold text-sm hover:bg-yellow-300"
            >
              🚗 Solicitar transporte
            </a>
            <a
              href="https://wa.me/5535992335194?text=Ola%21+Quero+saber+mais+sobre+os+passeios+da+Mundo+Verde+Tour."
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-full border border-slate-500 text-sm font-semibold hover:bg-slate-800"
            >
              ✨ Ver opções de passeios
            </a>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden border border-slate-700 bg-slate-800 shadow-2xl">
          <img
            src="/mundoverdetour/banner-conforto-seguranca.jpg"
            alt="Conforto e segurança - Mundo Verde Tour"
            className="w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}