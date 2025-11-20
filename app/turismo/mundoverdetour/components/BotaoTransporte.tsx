// app/turismo/mundoverdetour/components/BotaoTransporte.tsx
"use client";

export default function BotaoTransporte() {
  const telefone = "5535992335194"; // número principal para o botão flutuante
  const mensagem = encodeURIComponent(
    "Olá! Gostaria de solicitar um transporte da Mundo Verde Tour em Monte Verde."
  );

  const link = https://wa.me/${telefone}?text=${mensagem};

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-full shadow-xl flex items-center gap-2 z-50"
    >
      🚗 Solicitar transporte
    </a>
  );
}