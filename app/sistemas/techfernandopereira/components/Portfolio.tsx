"use client";

import Image from "next/image";
import Link from "next/link";

type Project = {
  title: string;
  desc: string;
  link: string;
  image: string;
  external?: boolean;
};

const projects: Project[] = [
  // 🛍️ Achadinhos
  {
    title: "Achadinhos da Gisa",
    desc: "Página de achadinhos com links para marketplaces.",
    link: "https://iadrogarias.com.br/achadinhos",
    image: "/achadinhosdagi.png",
    external: true,
  },

  // 🔧 Auto Elétrica - Ninho Car
  {
    title: "Ninho Car Auto Elétrica",
    desc: "Site institucional para auto elétrica e conveniência.",
    link: "https://www.iadrogarias.com.br/autoeletrico/ninhocar",
    image: "/ninhocar.png",
    external: true,
  },

  // 📸 Fotografia
  {
    title: "Stephany Vital Fotografia",
    desc: "Site profissional para fotógrafa.",
    link: "https://www.iadrogarias.com.br/fotografos/stephanyvital",
    image: "/stephanyvital.png",
    external: true,
  },

  // 🛒 Mercado / Conveniência
  {
    title: "Lojinha da Oportunidade",
    desc: "Site para mercado e loja de conveniência.",
    link: "https://www.iadrogarias.com.br/mercados/lojinhadaoportunidades",
    image: "/lojinhadaoportunidade.png",
    external: true,
  },

  // 🍗 Alimentação / PDV
  {
    title: "Gigante dos Assados",
    desc: "Sistema de PDV, vendas e operação completa.",
    link: "/gigante",
    image: "/gigante.png",
  },

  // 🧠 Avaliação de Prescrição
  {
    title: "Avalia Medic",
    desc: "Sistema de avaliação de prescrição médica.",
    link: "/avaliamedic",
    image: "/avaliamedic.png",
  },

  // 💰 Controle Financeiro
  {
    title: "Controle Financeiro",
    desc: "Dashboard financeiro para gestão completa.",
    link: "/financeiro",
    image: "/financeiro.png",
  },

  // 💊 E-commerce Drogaria
  {
    title: "E-commerce de Drogaria",
    desc: "E-commerce de medicamentos e perfumaria.",
    link: "/fv",
    image: "/drogarias.png",
  },

  // 🏠 Imobiliária
  {
    title: "Imóveis Compra e Venda",
    desc: "Plataforma de anúncios imobiliários.",
    link: "/imoveisrapido",
    image: "/imoveisrapido.png",
  },

  // 🍦 Sorveteria
  {
    title: "Sorveteria Oggi",
    desc: "Site + sistema de pedidos (em construção).",
    link: "/sorveteria",
    image: "/oggi.png",
  },

  // 🚐 Turismo
  {
    title: "Mundo Verde Tour",
    desc: "Site + painel administrativo para turismo.",
    link: "/turismo/mundoverdetour",
    image: "/mundoverde.png",
  },

  // 🔊 Auto Elétrica
  {
    title: "Dani Sound",
    desc: "Site institucional para auto elétrica e som automotivo.",
    link: "/autoeletrico/danisound",
    image: "/danisound.png",
  },

  // ⚖️ Jurídico
  {
    title: "Dr. Marcos Luciano",
    desc: "Site institucional para advogado criminalista.",
    link: "/servicos/advogado/marcosluciano",
    image: "/marcosluciano.png",
  },

  // 🦷 Clínica Odontológica
  {
    title: "Dra. Anne Dayane",
    desc: "Site institucional para clínica odontológica.",
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
          {projects.map((p, i) => {
            const Card = (
              <div
                className="group block rounded-xl overflow-hidden border border-gray-800 bg-[#0A0F16]
                           hover:border-blue-500 transition-all duration-300
                           hover:shadow-xl hover:shadow-blue-500/10"
              >
                <div className="w-full h-44 relative overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold group-hover:text-blue-400 transition">
                    {p.title}
                  </h3>
                  <p className="text-gray-400 mt-2 text-sm">{p.desc}</p>
                </div>
              </div>
            );

            return p.external ? (
              <a
                key={i}
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {Card}
              </a>
            ) : (
              <Link key={i} href={p.link}>
                {Card}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
