// app/turismo/mundoverdetour/components/BotaoTransporte.tsx
"use client";

export default function BotaoTransporte() {
  const telefone = "5535992335194";

  const mensagem = encodeURIComponent(
    "Ola! Gostaria de solicitar um transporte da Mundo Verde Tour em Monte Verde."
  );

  const link = `https://wa.me/${telefone}?text=${mensagem}`;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 bg-[#111827] hover:bg-black text-white font-semibold px-5 py-3 rounded-full shadow-xl flex items-center gap-2 z-50"
    >
      🚗 Solicitar transporte
    </a>
  );
}