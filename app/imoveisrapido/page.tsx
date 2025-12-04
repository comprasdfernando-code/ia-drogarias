"use client";

import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <div>

      {/* HERO */}
      <section className="relative w-full h-[550px] flex items-center">
        <Image
          src="/imoveisrapido/hero.jpg"
          alt="Hero Imoveis Rapido"
          fill
          className="object-cover brightness-75"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-white text-4xl md:text-6xl font-bold drop-shadow-lg">
            Encontre seu imóvel rápido e fácil
          </h1>
          <p className="text-white text-xl mt-4 max-w-2xl">
            A plataforma ágil que conecta compradores, corretores e proprietários.
          </p>

          {/* BUSCA */}
          <div className="mt-8 bg-white rounded-lg shadow-xl p-4 flex flex-col md:flex-row gap-4 w-full max-w-3xl">
            <input
              type="text"
              placeholder="Digite o bairro ou cidade"
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
            />
            <input
              type="number"
              placeholder="Preço máximo"
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
            />
            <button className="bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg px-6 py-3">
              Buscar
            </button>
          </div>
        </div>
      </section>

      {/* IMÓVEIS EM DESTAQUE */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          Imóveis em Destaque
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div key={item} className="border rounded-xl shadow-lg overflow-hidden">
              <Image
                src="/imoveisrapido/casa1.jpg"
                alt="Casa"
                width={400}
                height={300}
                className="object-cover w-full h-56"
              />
              <div className="p-4">
                <h3 className="font-bold text-xl text-gray-800">
                  Casa à venda em São Mateus
                </h3>
                <p className="text-blue-700 font-bold text-2xl">R$ 350.000</p>

                <p className="text-gray-600 mt-2">
                  🛏 3 · 🚿 2 · 🚗 2
                </p>

                <div className="mt-4 flex gap-3">
                  <Link
                    href="#"
                    className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
                  >
                    Ver imóvel
                  </Link>

                  <a
                    href="https://wa.me/5511982047548"
                    target="_blank"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="mt-20 bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-10 text-gray-800">
            Como funciona
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="font-bold text-xl text-blue-700 mb-3">1. Anuncie</h3>
              <p className="text-gray-600">Publique seu imóvel rapidamente.</p>
            </div>
            <div>
              <h3 className="font-bold text-xl text-blue-700 mb-3">2. Divulgamos</h3>
              <p className="text-gray-600">
                Seu anúncio alcança compradores e corretores.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-xl text-blue-700 mb-3">3. Você vende rápido</h3>
              <p className="text-gray-600">
                Negociação direta, sem burocracia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mt-20 text-center px-4">
        <h2 className="text-3xl font-bold text-gray-800">
          Pronto para anunciar seu imóvel?
        </h2>
        <p className="text-gray-600 mt-2">
          Cadastre em poucos minutos e comece a receber contatos.
        </p>

        <Link
          href="#"
          className="inline-block mt-6 bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-orange-700"
        >
          Anunciar meu imóvel
        </Link>
      </section>

      <div className="h-20" />
    </div>
  );
}
