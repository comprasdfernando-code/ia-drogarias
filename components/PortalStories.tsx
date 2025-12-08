"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { useRouter } from "next/navigation";

const lojas = [
  { id: "drogaria", nome: "IA Drogarias", imagem: "/shopping/drogaria.png", link: "/drogarias" },
  { id: "gigante", nome: "Gigante dos Assados", imagem: "/shopping/gigante.png", link: "/gigante" },
  { id: "oggi", nome: "Sorveteria Oggi", imagem: "/shopping/oggi.png", link: "/sorveteria/oggi" },
  { id: "danisound", nome: "Dani Sound", imagem: "/shopping/danisound.png", link: "/danisound" },
  { id: "draanne", nome: "Dra Anne Dayane", imagem: "/shopping/draanne.png", link: "/clinicas/draannedayane" },
  { id: "fisio", nome: "FisioPet", imagem: "/shopping/fisiopet.png", link: "/pet" },
  { id: "imoveis", nome: "Imóveis", imagem: "/shopping/imoveis.png", link: "/imoveis" },
];

export default function PortalStories() {
  const router = useRouter();

  

  // Embla Carousel hook
  const [emblaRef, embla] = useEmblaCarousel({ loop: false, dragFree: true, align: "center", });

  const [index, setIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!embla) return;
    setIndex(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on("select", onSelect);
    onSelect();
  }, [embla, onSelect]);

  return (
    <div className="w-full min-h-screen bg-[#050B15] flex flex-col items-center">
      
      <h1 className="text-white text-4xl font-bold mt-10 mb-8">
        Shopping IA Drogarias
      </h1>

      {/* CARROSSEL */}
      <div className="w-full max-w-4xl overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6 p-4">
          {lojas.map((loja, i) => {
            const ativo = i === index;

            return (
              <motion.div
                key={loja.id}
                onClick={() => router.push(loja.link)}
                className="relative cursor-pointer flex-shrink-0"
                animate={{
                  scale: ativo ? 1 : 0.75,
                  opacity: ativo ? 1 : 0.4,
                  filter: ativo ? "blur(0px)" : "blur(3px)",
                }}
                transition={{ duration: 0.35 }}
              >
                <Image
                  src={loja.imagem}
                  alt={loja.nome}
                  width={350}
                  height={500}
                  className="rounded-2xl border border-cyan-500/30 shadow-xl"
                />

                <p className="text-white text-center mt-3 text-lg">
                  {loja.nome}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
