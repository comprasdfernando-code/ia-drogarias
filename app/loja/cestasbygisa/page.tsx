"use client";

import Image from "next/image";

function buildWhatsAppLink(number: string, msg: string) {
  const clean = number.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

const WHATS = "11983273348";
const WA_LINK = buildWhatsAppLink(
  WHATS,
  "Olá! Quero pedir uma cesta da Cestas by Gisa 🧺✨"
);

export default function Page() {
  return (
    <main className="bg-[#fff7f5] text-[#3b2f2f]">

      {/* HERO */}
      <section className="text-center py-16 px-4 bg-gradient-to-b from-[#ffe4e1] to-[#fff7f5]">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Surpreenda com uma Cesta Especial 💖
        </h1>
        <p className="text-lg mb-6">
          Café da manhã, presentes e momentos inesquecíveis
        </p>

        <a
          href={WA_LINK}
          target="_blank"
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg"
        >
          Pedir no WhatsApp 🚀
        </a>
      </section>

      {/* CATEGORIAS */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Nossas Cestas
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              titulo: "Café da Manhã ☕",
              img: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0",
            },
            {
              titulo: "Romântica 💖",
              img: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
            },
            {
              titulo: "Premium 🎁",
              img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:scale-105 transition"
            >
              <Image
                src={item.img}
                alt={item.titulo}
                width={400}
                height={300}
                className="w-full h-56 object-cover"
              />
              <div className="p-4 text-center">
                <h3 className="font-semibold text-lg">{item.titulo}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-[#fff] py-12 px-4">
        <h2 className="text-2xl font-bold text-center mb-8">
          Como Funciona
        </h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto text-center">
          <div>
            <h3 className="font-bold text-lg mb-2">1️⃣ Escolha</h3>
            <p>Escolha a cesta ideal para o momento</p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">2️⃣ Personalize</h3>
            <p>Chame no WhatsApp e personalize seu pedido</p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">3️⃣ Receba</h3>
            <p>Entrega rápida direto na casa de quem você ama</p>
          </div>
        </div>
      </section>

      {/* PROVA SOCIAL */}
      <section className="py-12 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Clientes Satisfeitos ❤️
        </h2>

        <div className="grid md:grid-cols-3 gap-6 text-center">
          {[
            "Amei! Muito capricho 😍",
            "Entrega perfeita e rápida!",
            "Minha esposa ficou encantada ❤️",
          ].map((texto, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl shadow"
            >
              <p>"{texto}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="text-center py-16 bg-[#ffe4e1] px-4">
        <h2 className="text-3xl font-bold mb-4">
          Faça sua surpresa hoje 🎁
        </h2>

        <a
          href={WA_LINK}
          target="_blank"
          className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg"
        >
          Pedir Agora no WhatsApp
        </a>
      </section>

      {/* RODAPÉ */}
      <footer className="bg-[#3b2f2f] text-white text-center py-6 px-4">
        <p className="mb-2">Cestas by Gisa 💖</p>
        <p className="mb-4">@cestas_by_gisa</p>

        <a
          href="https://www.iadrogarias.com.br/fv"
          target="_blank"
          className="text-green-300 underline"
        >
          💊 Conheça também nossa Farmácia Online
        </a>
      </footer>
    </main>
  );
}