// app/turismo/mundoverdetour/components/Galeria.tsx
const fotos = [
  {
    src: "https://images.pexels.com/photos/5726885/pexels-photo-5726885.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Centro de Monte Verde",
  },
  {
    src: "https://images.pexels.com/photos/5726888/pexels-photo-5726888.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Natureza em Monte Verde",
  },
  {
    src: "https://images.pexels.com/photos/5726890/pexels-photo-5726890.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Paisagem de serra",
  },
];

export default function Galeria() {
  return (
    <section className="bg-green-50 py-14 md:py-20">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-green-900 mb-6">
          Um pouquinho de Monte Verde para você
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {fotos.map((foto) => (
            <div
              key={foto.alt}
              className="rounded-2xl overflow-hidden shadow-sm border border-green-100"
            >
              <img
                src={foto.src}
                alt={foto.alt}
                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          As imagens são ilustrativas. No futuro você pode trocar pelas fotos
          reais do Instagram do @mundoverdetour.
        </p>
      </div>
    </section>
  );
}