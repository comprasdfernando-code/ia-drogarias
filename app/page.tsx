"use client";

import Slider from "react-slick";
import Image from "next/image";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function HomePage() {
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

  // Banners do carrossel
  const banners = [
    {
      src: "/banners/ecommerce.png",
      alt: "E-commerce",
      link: "/produtos",
    },
    {
      src: "/banners/cadastro-farmaceutico.png",
      alt: "Cadastro de Farmacêutico",
      link: "/cadastro-farmaceutico",
    },
    {
      src: "/banners/cadastro-drogaria.png",
      alt: "Cadastro de Drogaria",
      link: "/cadastro-drogaria",
    },
    {
      src: "/banners/servicos-farmaceuticos.png",
      alt: "Serviços Farmacêuticos",
      link: "/servicos",
    },
  ];

  return (
    <main className="w-full mx-auto">
      {/* Banner principal — ocupa toda a largura da tela */}
      <div className="max-w-5xl mx-auto p-4">
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

      
     className="w-full mx-auto"
      {/* Carrossel de promoções */}
      <div className="relative w-full">
        <Image
          src="/banners/banner-principal.png"
          alt="Banner Principal IA Drogarias"
          width={1920}
          height={400}
          className="w-full h-auto object-cover shadow-md"
          priority
        />
      </div>
    </main>
  );
}
