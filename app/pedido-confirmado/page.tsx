"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function PedidoConfirmado() {
  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      
      {/* Ícone */}
      <div className="flex justify-center mb-6">
        <CheckCircle size={70} className="text-green-500 drop-shadow-lg" />
      </div>

      {/* Título */}
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-4">
        Pedido Confirmado! 🎉
      </h1>

      {/* Mensagem */}
      <p className="text-center text-gray-700 mb-6 leading-relaxed">
        Seu pagamento foi aprovado e seu pedido já está sendo processado pela 
        equipe <b>IA Drogarias – Saúde com Inteligência</b>.
        <br />
        Em instantes você receberá atualizações no WhatsApp.
      </p>

      {/* Caixa informativa */}
      <div className="bg-white border border-blue-100 shadow-sm rounded-xl p-5 mb-6">
        <p className="text-center text-gray-600">
          Obrigado por comprar com a IA Drogarias!  
          Toda entrega é feita com segurança e cuidado.
        </p>
      </div>

      {/* Botões */}
      <div className="flex flex-col gap-4">

        {/* WhatsApp */}
        <a
          href="https://wa.me/5511952068432?text=Olá%20IA%20Drogarias!%20Gostaria%20de%20saber%20sobre%20meu%20pedido."
          target="_blank"
          className="w-full py-3 rounded-xl text-center text-white font-semibold bg-green-600 hover:bg-green-700 transition"
        >
          Falar com Suporte via WhatsApp
        </a>

        {/* Voltar ao site */}
        <Link
          href="/"
          className="w-full py-3 rounded-xl text-center font-semibold border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
        >
          Voltar para a Página Inicial
        </Link>

      </div>

      {/* Rodapé */}
      <p className="mt-8 text-center text-xs text-gray-400">
        IA Drogarias • Tecnologia e Cuidado com Você 💙
      </p>
    </main>
  );
}
