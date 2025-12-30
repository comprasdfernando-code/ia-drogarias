// app/achadinhos/page.tsx

export const metadata = {
  title: "Achadinhos Úteis da Gisa",
  description: "Achados práticos, baratos e que valem a pena ✨",
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

  // ✅ WhatsApp da Gisa (55 + DDD + número)
  const whatsappNumber = "5511983273348";

  const whatsapp = buildWhatsAppLink(
    whatsappNumber,
    "Oi Gisa! Vim pelo site dos achadinhos 😊 Pode me ajudar?"
  );

  const destaques: Destaque[] = [
    {
      titulo: "Organização para casa",
      desc: "Achadinhos pra deixar tudo no lugar.",
      link: shopee,
      tag: "Casa",
    },
    {
      titulo: "Cozinha prática",
      desc: "Itens úteis e baratos pro dia a dia.",
      link: shopee,
      tag: "Cozinha",
    },
    {
      titulo: "Beleza & autocuidado",
      desc: "Produtos bem avaliados que valem a pena.",
      link: shopee,
      tag: "Beleza",
    },
    {
      titulo: "Eletrônicos úteis",
      desc: "Gadgets simples que ajudam muito.",
      link: shopee,
      tag: "Tech",
    },
    {
      titulo: "Infantil",
      desc: "Coisas úteis para crianças e família.",
      link: shopee,
      tag: "Família",
    },
    {
      titulo: "Novidades e reviews",
      desc: "Vídeos e indicações do dia a dia no Insta.",
      link: insta,
      tag: "Instagram",
    },
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* =========================
            TOP
        ========================= */}
        <header className="text-center">
          {/* Avatar simples (troque por foto depois se quiser) */}
          <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-extrabold">
            G
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
            Achadinhos Úteis da Gisa
          </h1>

          <p className="mt-2 text-gray-600">
            Achados práticos, baratos e que valem a pena ✨
          </p>

          {/* CTAs */}
          <div className="mt-6 grid gap-3">
            <a
              href={shopee}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-2xl bg-black px-5 py-4 text-white font-semibold hover:opacity-90 transition"
            >
              🛍️ Ver achadinhos na Shopee
            </a>

            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-2xl bg-gray-100 px-5 py-4 font-semibold hover:bg-gray-200 transition"
            >
              💬 Falar com a Gisa no WhatsApp
            </a>

            <a
              href={insta}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-2xl bg-gray-100 px-5 py-4 font-semibold hover:bg-gray-200 transition"
            >
              📸 Instagram (novidades e reviews)
            </a>
          </div>

          {/* Links pequenos abaixo (opcional, mas ajuda UX) */}
          <div className="mt-4 flex items-center justify-center gap-3 text-sm text-gray-500">
            <a className="underline" href={insta} target="_blank" rel="noreferrer">
              Instagram
            </a>
            <span>•</span>
            <a className="underline" href={shopee} target="_blank" rel="noreferrer">
              Shopee
            </a>
            <span>•</span>
            <a className="underline" href={whatsapp} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        </header>

        {/* =========================
            DESTAQUES
        ========================= */}
        <section className="mt-10">
          <h2 className="text-xl font-bold">Destaques</h2>
          <p className="mt-1 text-gray-600">
            Seleções rápidas pra você achar o que precisa.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {destaques.map((d) => (
              <a
                key={d.titulo}
                href={d.link}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-lg font-semibold">{d.titulo}</div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {d.tag}
                  </span>
                </div>

                <div className="mt-2 text-gray-600">{d.desc}</div>

                <div className="mt-4 text-sm font-semibold text-gray-900">
                  Ver agora →
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* =========================
            COMO FUNCIONA
        ========================= */}
        <section className="mt-10 rounded-2xl bg-gray-50 p-6">
          <h2 className="text-xl font-bold">Como funciona</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 border border-gray-200">
              <div className="font-semibold">1) Escolha</div>
              <div className="text-gray-600 mt-1">
                Veja os achadinhos por categoria.
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 border border-gray-200">
              <div className="font-semibold">2) Clique e compre</div>
              <div className="text-gray-600 mt-1">
                Compra segura direto pela Shopee.
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 border border-gray-200">
              <div className="font-semibold">3) Receba em casa</div>
              <div className="text-gray-600 mt-1">
                Entrega e rastreio pela plataforma.
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            RODAPÉ
        ========================= */}
        <footer className="mt-10 text-center text-sm text-gray-500">
          <p>Links oficiais da Gisa:</p>

          <p className="mt-2">
            <a className="underline" href={insta} target="_blank" rel="noreferrer">
              Instagram
            </a>{" "}
            •{" "}
            <a className="underline" href={shopee} target="_blank" rel="noreferrer">
              Shopee
            </a>{" "}
            •{" "}
            <a className="underline" href={whatsapp} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </p>

          <p className="mt-3">© {new Date().getFullYear()} Achadinhos Úteis da Gisa</p>
        </footer>

        {/* =========================
            BOTÃO FLUTUANTE WHATSAPP
        ========================= */}
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          aria-label="Falar com a Gisa no WhatsApp"
          className="fixed bottom-5 right-5 z-50 rounded-full bg-black text-white shadow-lg px-5 py-3 font-semibold hover:opacity-90 transition"
        >
          💬 WhatsApp
        </a>
      </div>
    </main>
  );
}
