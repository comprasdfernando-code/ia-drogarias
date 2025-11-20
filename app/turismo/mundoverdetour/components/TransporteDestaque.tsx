// app/turismo/mundoverdetour/components/TransporteDestaque.tsx
export default function TransporteDestaque() {
  return (
    <section className="bg-slate-900 text-white py-14 md:py-20">
      <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-[1.2fr,1fr] gap-10 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-lime-300 mb-2">
            Transporte • Transfer • Uber turístico
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
            Conforto e segurança em cada trajeto
          </h2>
          <p className="text-sm md:text-base text-slate-100 mb-5">
            Somos especializados em <strong>Uber turístico</strong>,{" "}
            <strong>transfer de aeroporto</strong>,{" "}
            <strong>city tour</strong> e <strong>passeios personalizados</strong>
            . Você escolhe o destino e nós cuidamos do resto.
          </p>

          <div className="rounded-2xl border border-yellow-400/60 bg-slate-900/60 p-4 mb-4">
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
              href="https://wa.me/5511948644843?text=Ol%C3%A1%21+Gostaria+de+um+or%C3%A7amento+de+transporte+em+Monte+Verde."
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-full bg-lime-400 text-slate-900 font-semibold text-sm hover:bg-lime-300"
            >
              🚗 Solicitar transporte
            </a>
            <a
              href="https://wa.me/5535992335194?text=Ol%C3%A1%21+Quero+saber+mais+sobre+os+passeios+da+Mundo+Verde+Tour."
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-full border border-slate-500 text-sm font-semibold hover:bg-slate-800"
            >
              ✨ Falar sobre passeios
            </a>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden border border-slate-700 bg-slate-800 shadow-2xl">
          <img
            src="https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Veículo de transporte confortável"
            className="w-full h-56 md:h-64 object-cover"
          />
        </div>
      </div>
    </section>
  );
}