"use client";

import { useState } from "react";

export default function SatisfacaoPage() {
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await fetch("https://formsubmit.co/iadrogarias@gmail.com", {
      method: "POST",
      body: formData,
    });
    setEnviado(true);
  };

  if (enviado) {
    return (
      <section className="flex flex-col items-center justify-center min-h-screen bg-blue-50 text-center p-6">
        <h2 className="text-3xl font-bold text-blue-700 mb-4">💙 Obrigado!</h2>
        <p className="text-gray-700 max-w-md">
          Sua avaliação foi enviada com sucesso.  
          A equipe da <strong>IA Drogarias</strong> agradece sua confiança 🙏  
        </p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold text-blue-700 mb-2">
        💙 Pesquisa de Satisfação – IA Drogarias
      </h1>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Sua opinião é muito importante! Conte pra gente como foi seu atendimento domiciliar 💉
      </p>

      <form
        onSubmit={handleSubmit}
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

        {/* Campos ocultos do formsubmit */}
        <input type="hidden" name="_captcha" value="false" />
        <input type="hidden" name="_next" value="https://iadrogarias.com.br/satisfacao" />

        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold py-2 px-6 rounded hover:bg-blue-700 transition"
        >
          Enviar Avaliação 💙
        </button>
      </form>
    </section>
  );
}