"use client";

import Image from "next/image";
import Link from "next/link";

const projects = [
  
 
 
  // 🍗 Alimentação / PDV
  {
    title: "Gigante dos Assados",
    desc: "Sistema de PDV, vendas e operação completa.",
    link: "/gigante",
    image: "/gigante.png",
  },
  {
    title: "Sorveteria Oggi",
    desc: "Site + sistema de pedidos (em construção).",
    link: "/sorveteria",
    image: "/oggi.png",
  },
 

  // 🚐 Turismo
  {
    title: "Mundo Verde Tour",
    desc: "Site + painel admin para agência de viagens.",
    link: "/turismo/mundoverdetour",
    image: "/mundoverde.png",
  },
  

  // 🔧 Auto Elétrica
  {
    title: "Dani Sound",
    desc: "Site para auto elétrica e som automotivo.",
    link: "/autoeletrico/danisound",
    image: "/danisound.png",
  },

 // ⚖️ Jurídico
{
    title: "Dr Marcos Luciano",
    desc: "Site institucional para advogado criminalista.",
    link: "/servicos/advogado/marcosluciano",
    image: "/marcosluciano.png",
  },
 // Clinica Dentaria
{
    title: "Dra Anne Dayane",
    desc: "Site institucional para Clincas Dentarias.",
    link: "/clinicas/draannedayane",
    image: "/draannedayane.png",
  },
   
];

export default function Portfolio() {
  return (
    <section className="w-full py-20 px-6 bg-[#070B11]">
      <div className="max-w-6xl mx-auto">

        <h2 className="text-3xl md:text-5xl font-bold text-center mb-14">
          Portfólio Completo
        </h2>

        <div className="grid gap-10 md:grid-cols-3">
          {projects.map((p, i) => (
            <Link
              key={i}
              href={p.link}
              className="group block rounded-xl overflow-hidden border border-gray-800 bg-[#0A0F16] 
                         hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
            >
              {/* IMAGEM */}
              {p.image && (
                <div className="w-full h-44 relative overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              )}

              {/* TEXTO */}
              <div className="p-6">
                <h3 className="text-xl font-semibold group-hover:text-blue-400 transition">
                  {p.title}
                </h3>
                <p className="text-gray-400 mt-2 text-sm">{p.desc}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
