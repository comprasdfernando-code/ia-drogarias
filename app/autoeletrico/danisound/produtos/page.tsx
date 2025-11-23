import Image from "next/image";
import Link from "next/link";

export default function ProdutosDaniSound() {
  const produtos = [
    { img: "led-s14.jpg", nome: "Super LED S14" },
    { img: "antena-lookout.jpg", nome: "Antena Interna Look-Out" },
    { img: "falante-hurricane.jpg", nome: "Alto-Falante Hurricane 65W" },
    { img: "alarme.jpg", nome: "Alarme Automotivo" },
    { img: "central-android.jpg", nome: "Central Multimídia Android" },
    { img: "camera-re.jpg", nome: "Câmera de Ré HD" },
    { img: "subwoofer.jpg", nome: "Subwoofer 10”" },
    { img: "modulo.jpg", nome: "Módulo Amplificador" },
    { img: "led-interno.jpg", nome: "Iluminação Interna LED" },
    { img: "milha-led.jpg", nome: "Kit Milha LED" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-20 text-white">

      {/* TÍTULO */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold neon-red">Produtos & Instalação</h1>
        <p className="text-zinc-300 max-w-2xl mx-auto text-sm">
          Produtos de qualidade + instalação profissional. O Dani trabalha apenas com marcas
          testadas e aprovadas para garantir segurança, desempenho e acabamento premium.
        </p>
      </div>

      {/* GRID DE PRODUTOS */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {produtos.map((p, i) => (
          <div
            key={i}
            className="card-premium-dark p-4 rounded-xl hover:border-red-700/50 transition overflow-hidden"
          >
            <div className="relative w-full h-40 rounded-lg overflow-hidden">
              <Image
                src={`/danisound/${p.img}`}
                alt={p.nome}
                fill
                className="object-cover img-neon"
              />
            </div>

            <h4 className="text-center text-sm font-semibold mt-3">{p.nome}</h4>

            <div className="text-center mt-3">
              <a
                href={`https://wa.me/5511977844066?text=Olá,+gostaria+de+informações+sobre:+${p.nome}`}
                target="_blank"
                className="inline-block text-xs px-4 py-2 rounded-full bg-red-700 hover:bg-red-800"
              >
                Pedir instalação
              </a>
            </div>
          </div>
        ))}
      </section>

      {/* CTA FINAL */}
      <div className="text-center pt-10">
        <Link
          href="/autoeletrico/danisound/orcamento"
          className="btn-neon px-8 py-4 text-lg rounded-full inline-block"
        >
          Solicitar orçamento completo
        </Link>
      </div>

    </div>
  );
}
