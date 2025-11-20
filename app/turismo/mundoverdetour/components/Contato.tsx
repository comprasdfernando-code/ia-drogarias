// app/turismo/mundoverdetour/components/Contato.tsx
export default function Contato() {
  return (
    <section
      id="contato"
      className="max-w-5xl mx-auto px-4 py-14 md:py-20 flex flex-col md:flex-row gap-10"
    >
      <div className="flex-1 space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#3C532B]">
          Fale com a Mundo Verde Tour
        </h2>
        <p className="text-slate-700">
          Conte pra gente como você imagina sua experiência em Monte Verde e
          montamos o melhor roteiro para você e sua família.
        </p>

        <div className="space-y-2 text-sm md:text-base">
          <p className="font-semibold text-[#3C532B]">Telefones / WhatsApp</p>
          <p>📞 (11) 94864-4843</p>
          <p>📞 (35) 99233-5194</p>

          <p className="font-semibold text-[#3C532B] mt-4">Instagram</p>
          <a
            href="https://www.instagram.com/mundoverdetour"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7A8C43] hover:underline"
          >
            @mundoverdetour
          </a>
        </div>
      </div>

      <div className="flex-1 rounded-3xl border border-green-100 bg-white shadow-sm p-5">
        <p className="text-sm text-slate-700 mb-3">
          Envie seus dados pelo WhatsApp e receba um atendimento personalizado:
        </p>
        <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1 mb-4">
          <li>Seu nome completo</li>
          <li>Data(s) da viagem</li>
          <li>Quantidade de pessoas</li>
          <li>Tipo de passeio ou transporte que você procura</li>
        </ol>

        <a
          href="https://wa.me/5535992335194?text=Ola%21+Quero+planejar+minha+viagem+com+a+Mundo+Verde+Tour+em+Monte+Verde."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex justify-center w-full mt-2 px-4 py-3 rounded-full bg-[#7A8C43] text-white font-semibold hover:bg-[#647238]"
        >
          Enviar informações pelo WhatsApp
        </a>
      </div>
    </section>
  );
}