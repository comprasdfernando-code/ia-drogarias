"use client"// app/turismo/mundoverdetour/components/Contato.tsx
export default function Contato() {
  return (
    <section
      id="contato"
      className="max-w-5xl mx-auto px-4 py-14 md:py-20 flex flex-col md:flex-row gap-10"
    >
      <div className="flex-1 space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-green-900">
          Fale com a Mundo Verde Tour
        </h2>
        <p className="text-slate-700">
          Conte pra gente como você imagina sua experiência em Monte Verde e
          montamos o melhor roteiro para você.
        </p>

        <div className="space-y-2 text-sm md:text-base">
          <p className="font-semibold text-green-800">Telefones / WhatsApp</p>
          <p>📞 (11) 94864-4843</p>
          <p>📞 (35) 99233-5194</p>

          <p className="font-semibold text-green-800 mt-4">Instagram</p>
          <a
            href="https://www.instagram.com/mundoverdetour"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 hover:underline"
          >
            @mundoverdetour
          </a>
        </div>
      </div>

      <div className="flex-1 rounded-3xl border border-green-100 bg-white shadow-sm p-5">
        <p className="text-sm text-slate-700 mb-3">
          Preencha os dados abaixo e envie pelo WhatsApp:
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-3 text-sm"
        >
          <input
            type="text"
            placeholder="Seu nome"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="text"
            placeholder="Data desejada"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="number"
            min={1}
            placeholder="Quantidade de pessoas"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <textarea
            rows={3}
            placeholder="Conte rapidamente o tipo de passeio ou transporte que você procura"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <a
            href="https://wa.me/5535992335194?text=Ol%C3%A1%21+Quero+planejar+minha+viagem+com+a+Mundo+Verde+Tour."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex justify-center w-full mt-2 px-4 py-3 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700"
          >
            Enviar informações pelo WhatsApp
          </a>
        </form>

        <p className="text-[11px] text-slate-400 mt-3">
          * Formulário ilustrativo. Se quiser, depois conecto isso com Supabase
          para registrar os leads.
        </p>
      </div>
    </section>
  );
}