// app/dayfestas/_components/WhatsAppFloat.tsx
"use client";

export default function WhatsAppFloat({
  phone,
  message,
}: {
  phone: string; // ex: 5511999999999
  message: string;
}) {
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed z-50 bottom-5 right-5 rounded-2xl px-4 py-3 bg-black text-white shadow-lg hover:opacity-90 transition flex items-center gap-2"
      aria-label="Chamar no WhatsApp"
      title="Chamar no WhatsApp"
    >
      <span className="text-lg">💬</span>
      <span className="text-sm font-semibold">WhatsApp</span>
    </a>
  );
}
