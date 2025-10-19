"use client";

import { useEffect, useState } from "react";
import Slider from "react-slick";
import Image from "next/image";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Tipo para produtos
interface Produto {
  id: number;
  nome: string;
  preco: number;
  categoria: string;
  imagem: string;
}

export default function HomePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // Simula produtos (pode conectar ao Supabase depois)
  useEffect(() => {
    setProdutos([
      {
        id: 1,
        nome: "ABC 10MG/G CREME DERM BG 20G",
        preco: 19.99,
        categoria: "Genéricos",
        imagem: "https://skzcvpkmcktjryvstcti.supabase.co/storage/v1/object/public/produtos/abc%20creme.webp",
      },
      {
        id: 2,
        nome: "ABCALCIUM KIDS 240ML",
        preco: 19.99,
        categoria: "Outros",
        imagem: "https://skzcvpkmcktjryvstcti.supabase.co/storage/v1/object/public/produtos/abcalcium-kids-240ml.png",
      },
      {
        id: 3,
        nome: "ABLOK 25MG CX 30 COMP",
        preco: 15.85,
        categoria: "Etico",
        imagem: "https://skzcvpkmcktjryvstcti.supabase.co/storage/v1/object/public/produtos/ablok-25mg-cx-30-comp.png",
      },
      {
        id: 4,
        nome: "ABRIFIT 7MG/ML XPE FR 100ML+COPO DOS",
        preco: 22.89,
        categoria: "Genéricos",
        imagem: "https://skzcvpkmcktjryvstcti.supabase.co/storage/v1/object/public/produtos/abrifit-7mgml-xpe-fr.png",
      },
    ]);
  }, []);

  // Configurações do carrossel
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
  };

  // Banners
  const banners = [
    { src: "/banners/servicos-farmaceuticos.png", alt: "Serviços Farmacêuticos", link: "/servicos" },
    { src: "/banners/cadastro-drogaria.png", alt: "Cadastro Drogaria", link: "/cadastro-drogaria" },
    { src: "/banners/ecommerce.png", alt: "E-commerce", link: "/produtos" },
  ];

  return (
    <main className="w-full mx-auto bg-gray-50 pb-10">
      
      {/* ======= CAMPO DE BUSCA ======= */}
      <div className="flex justify-center mt-4 mb-6 px-4">
        <div className="flex w-full max-w-xl bg-white rounded-full shadow-md overflow-hidden border border-gray-200">
          <input
            type="text"
            placeholder="Buscar produtos..."
            className="flex-grow px-4 py-2 text-gray-700 focus:outline-none"
          />
          <button className="bg-blue-700 text-white px-5 py-2 hover:bg-blue-800 transition-all">
            🔍
          </button>
        </div>
      </div>

      {/* ======= CARROSSEL ======= */}
      <div className="max-w-5xl mx-auto px-4">
        <Slider {...settings}>
          {banners.map((banner, index) => (
            <div key={index} className="p-2">
              <a href={banner.link}>
                <img
                  src={banner.src}
                  alt={banner.alt}
                  className="w-full rounded-2xl shadow-lg object-cover transition-transform duration-300 hover:scale-[1.02]"
                />
              </a>
            </div>
          ))}
        </Slider>
      </div>

      {/* ======= TEXTO DE BOAS-VINDAS ======= */}
      <section className="text-center mt-8 mb-6 px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-blue-700">
          Bem-vindo à IA Drogarias
        </h2>
        <p className="text-gray-600 text-sm md:text-base">
          Inteligência a serviço da sua saúde 💙
        </p>
      </section>

      {/* ======= LISTA DE PRODUTOS (RESPONSIVA) ======= */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {produtos.map((produto) => (
            <div
              key={produto.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-3 flex flex-col items-center border border-gray-100"
            >
              <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                <Image
                  src={produto.imagem}
                  alt={produto.nome}
                  width={130}
                  height={130}
                  className="object-contain"
                />
              </div>

              <h2 className="text-center text-[13px] font-medium text-gray-800 mt-2 leading-tight">
                {produto.nome}
              </h2>

              <p className="text-xs text-gray-500 mt-1">{produto.categoria}</p>

              <p className="text-green-600 font-bold mt-1 text-sm">
                R$ {produto.preco.toFixed(2).replace(".", ",")}
              </p>

              <button className="mt-2 bg-blue-700 text-white text-xs px-3 py-2 rounded-md hover:bg-blue-800 transition-colors w-full">
                Adicionar
              </button>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}