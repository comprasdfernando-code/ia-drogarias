"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function SatisfacaoPage() {
  const params = useSearchParams();
  const sucesso = params.get("sucesso");

  if (sucesso) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-blue-50 text-center p-6">
        <Image
          src="/logo.png"
          alt="Logo IA Drogarias"
          width={120}
          height={120}
          className="mb-4"
        />
        <h2 className="text-3xl font-bold text-blue-700 mb-4">
          💙 Obrigado pela sua avaliação!
        </h2>
        <p className="text-gray-700 max-w-md">
          Sua opinião é muito importante e ajuda a <strong>IA Drogarias</strong> 
          a continuar oferecendo um atendimento com carinho e qualidade.
        </p>
        <p className="mt-6 text-blue-600 font-semibold">
          O farmacêutico amigo da sua família 💊
        </p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <Image
        src="/logo.png"
        alt="Logo IA Drogarias"
        width={120}
        height={120}
        className="mb-4"
      />
      <h1 className="text-3xl font-bold text-blue-700 mb-2">
        💙 Pesquisa de Satisfação – IA Drogarias
      </h1>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Sua opinião é muito importante! Conte pra gente como foi seu atendimento domiciliar 💉
      </p>

      <form
        action="https://formsubmit.co/iadrogarias@gmail.com"
        method="POST"
        className="bg-white shadow-md rounded-lg p-6 w-full max-w-lg"
      >
        <label className="block text-left mb-2 font-semibold">
          Como você avalia o atendimento do farmacêutico?
        </label>
        <select name="Atendimento" required className="w-full border p-2 rounded mb-4">
          <option>⭐️ Excelente</option>
          <option>🙂 Bom</option>
          <option>😐 Regular</option>
          <option>🙁 Ruim</option>
        </select>

        <label className="block text-left mb-2 font-semibold">
          O profissional foi pontual e atencioso?
        </label>
        <select name="Pontualidade" required className="w-full border p-2 rounded mb-4">
          <option>✅ Sim</option>
          <option>🤔 Parcialmente</option>
          <option>❌ Não</option>
        </select>

        <label className="block text-left mb-2 font-semibold">
          Você se sentiu seguro(a) durante a aplicação?
        </label>
        <select name="Segurança" required className="w-full border p-2 rounded mb-4">
          <option>💪 Sim</option>
          <option>😐 Parcialmente</option>
          <option>🚫 Não</option>
        </select>

        <label className="block text-left mb-2 font-semibold">
          Recomendaria a IA Drogarias a amigos ou familiares?
        </label>
        <select name="Recomendação" required className="w-full border p-2 rounded mb-4">
          <option>🙌 Sim, com certeza</option>
          <option>🤷 Talvez</option>
          <option>👎 Não</option>
        </select>

        <label className="block text-left mb-2 font-semibold">
          Quer deixar um elogio ou sugestão?
        </label>
        <textarea
          name="Mensagem"
          rows={3}
          className="w-full border p-2 rounded mb-4"
          placeholder="Escreva aqui..."
        ></textarea>

        {/* Configurações do FormSubmit */}
        <input type="hidden" name="_captcha" value="false" />
        <input type="hidden" name="_next" value="https://iadrogarias.com.br/satisfacao?sucesso=true" />

        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold py-2 px-6 rounded hover:bg-blue-700 transition w-full"
        >
          Enviar Avaliação 💙
        </button>
      </form>
    </section>
  );
}