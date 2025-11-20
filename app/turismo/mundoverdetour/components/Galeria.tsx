// app/turismo/mundoverdetour/components/Galeria.tsx
const fotos = [
  {
    src: "/mundoverdetour/termometro-monte-verde.jpg",
    alt: "Termômetro marcando frio em Monte Verde",
  },
  {
    src: "/mundoverdetour/quadriciclo-menino.jpg",
    alt: "Passeio de quadriciclo com criança em Monte Verde",
  },
  {
    src: "/mundoverdetour/quadriciclo-familia.jpg",
    alt: "Família em passeio de quadriciclo em Monte Verde",
  },
  {
    src: "/mundoverdetour/banner-monte-verde-experiencias.jpg",
    alt: "Banner Venha conhecer Monte Verde",
  },
  {
    src: "/mundoverdetour/descubra-monte-verde-card.jpg",
    alt: "Card Descubra Monte Verde",
  },
  {
    src: "/mundoverdetour/hero-centro-noite.jpg",
    alt: "Centro de Monte Verde à noite",
  },
];

export default function Galeria() {
  return (
    <section className="bg-green-50 py-14 md:py-20">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#3C532B] mb-6">
          Monte Verde pelos olhos da Mundo Verde Tour
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {fotos.map((foto) => (
            <div
              key={foto.alt}
              className="rounded-2xl overflow-hidden shadow-sm border border-green-100 bg-white"
            >
              <img
                src={foto.src}
                alt={foto.alt}
                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}