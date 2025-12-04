"use client";

import Image from "next/image";

export default function ImovelPage({ params }: any) {
  const { id } = params;

  // MOCK de imóvel
  const imovel = {
    id,
    titulo: "Casa à venda em São Mateus",
    preco: "350.000",
    descricao: `
      Casa ampla, recém reformada, com excelente iluminação natural.
      Possui sala grande, cozinha moderna, 3 dormitórios e área de serviço.
      Localização privilegiada e segura.
    `,
    detalhes: {
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      tamanho: "120m²",
    },
    imagem: "/imoveisrapido/casa1.jpg",
    endereco: "Rua Exemplo, Jardim São Mateus - SP",
    whatsapp: "5511982047548",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* TÍTULO */}
      <h1 className="text-3xl font-bold text-gray-800">{imovel.titulo}</h1>

      <p className="text-blue-700 font-bold text-4xl mt-2">
        R$ {imovel.preco}
      </p>

      {/* CARROSSEL DE IMAGENS */}
      <div className="mt-6 w-full">
        <Image
          src={imovel.imagem}
          alt="Imagem do imóvel"
          width={1200}
          height={600}
          className="rounded-xl shadow-lg object-cover w-full h-[420px]"
        />
      </div>

      {/* DETALHES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">

        {/* Coluna da descrição */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Descrição</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {imovel.descricao}
          </p>

          {/* Características */}
          <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-800">
            Características
          </h2>

          <ul className="text-gray-700 space-y-2">
            <li>🛏 Quartos: {imovel.detalhes.quartos}</li>
            <li>🚿 Banheiros: {imovel.detalhes.banheiros}</li>
            <li>🚗 Vagas na garagem: {imovel.detalhes.vagas}</li>
            <li>📐 Tamanho: {imovel.detalhes.tamanho}</li>
            <li>📍 Endereço: {imovel.endereco}</li>
          </ul>

          {/* BOTÃO WHATSAPP */}
          <a
            href={`https://wa.me/${imovel.whatsapp}`}
            className="inline-block mt-8 bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-green-700"
          >
            Falar no WhatsApp
          </a>
        </div>

        {/* Coluna com mapa */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Localização
          </h2>

          <div className="w-full h-80 rounded-xl overflow-hidden shadow-lg">
            <iframe
              width="100%"
              height="100%"
              loading="lazy"
              src="https://maps.google.com/maps?q=São%20Mateus%20SP&t=&z=14&ie=UTF8&iwloc=&output=embed"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
