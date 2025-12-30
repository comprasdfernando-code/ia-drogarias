// app/achadinhos/page.tsx

export const metadata = {
  title: "Achadinhos Úteis da Gisa",
  description: "Achados úteis, lindos e que valem a pena 💖",
};

function buildWhatsAppLink(numberE164: string, msg: string) {
  const clean = numberE164.replace(/\D/g, "");
  const text = encodeURIComponent(msg);
  return `https://wa.me/${clean}?text=${text}`;
}

type Destaque = {
  titulo: string;
  desc: string;
  link: string;
  tag: string;
};

export default function AchadinhosPage() {
  const insta = "https://www.instagram.com/achadinhosuteisdagisa";
  const shopee = "https://shpe.site/achadinhosuteisdagisa";

  const whatsapp = buildWhatsAppLink(
    "5511983273348",
    "Oi Gisa! Vim pelo site dos achadinhos 💖 Pode me ajudar?"
  );

  const destaques: Destaque[] = [
    { titulo: "Organização para casa", desc: "Deixe tudo lindo e no lugar ✨", link: shopee, tag: "Casa" },
    { titulo: "Cozinha prática", desc: "Facilidades que fazem diferença 🍳", link: shopee, tag: "Cozinha" },
    { titulo: "Beleza & autocuidado", desc: "Cuidados que você merece 💄", link: shopee, tag: "Beleza" },
    { titulo: "Eletrônicos úteis", desc: "Gadgets que salvam o dia 🔌", link: shopee, tag: "Tech" },
    { titulo: "Infantil", desc: "Praticidade para a família 👶", link: shopee, tag: "Família" },
    { titulo: "Reviews & novidades", desc: "Veja tudo nos stories 📸", link: insta, tag: "Instagram" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white text-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* TOPO COM IMAGEM */}
        <header className="text-center">
          <div className="mx-auto w-40 h-40 rounded-full overflow-hidden shadow-lg border-4 border-pink-300">
            <img
              src="/achadinhos/gisa.jpg"
              alt="Achadinhos Úteis da Gisa"
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="mt-5 text-3xl font-extrabold text-pink-600">
            Achadinhos Úteis da Gisa
          </h1>

          <p className="mt-2 text-pink-500 font-medium">
            Achados lindos, úteis e que valem a pena 💖
          </p>

          {/* BOTÕES */}
          <div className="mt-6 grid gap-3">
            <a
              href={shopee}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-4 text-white font-bold shadow-md hover:scale-[1.02] transition"
            >
              🛍️ Ver achadinhos na Shopee
            </a>

            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-2xl bg-pink-100 px-5 py-4 font-semibold text-pink-700 hover:bg-pink-200 transition"
            >
              💬 Falar com a Gisa no WhatsApp
            </a>

            <a
              href={insta}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-2xl bg-pink-100 px-5 py-4 font-semibold text-pink-700 hover:bg-pink-200 transition"
            >
              📸 Instagram (novidades e reviews)
            </a>
          </div>
        </header>

        {/* DESTAQUES */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-pink-600">✨ Destaques da Gisa</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {destaques.map((d) => (
              <a
                key={d.titulo}
                href={d.link}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-white border border-pink-100 p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-lg font-semibold text-pink-700">{d.titulo}</h3>
                  <span className="text-xs bg-pink-100 text-pink-600 px-3 py-1 rounded-full font-semibold">
                    {d.tag}
                  </span>
                </div>

                <p className="mt-2 text-gray-600">{d.desc}</p>
                <div className="mt-4 font-bold text-pink-600">Ver agora →</div>
              </a>
            ))}
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="mt-12 bg-pink-50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-pink-600">💕 Como funciona</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {["Escolha seu achadinho", "Compre com segurança", "Receba em casa"].map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-pink-100 text-center">
                <div className="text-pink-600 font-bold mb-1">{i + 1}</div>
                <div className="font-semibold">{t}</div>
              </div>
            ))}
          </div>
        </section>

        {/* RODAPÉ */}
        <footer className="mt-12 text-center text-sm text-pink-500">
          <p>© {new Date().getFullYear()} Achadinhos Úteis da Gisa</p>
        </footer>

        {/* WHATSAPP FLUTUANTE */}
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 right-5 z-50 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-5 py-3 rounded-full shadow-xl font-bold hover:scale-105 transition"
        >
          💬 WhatsApp
        </a>
      </div>
    </main>
  );
}
