"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Loja = {
  id: string;
  nome: string;
  imagem: string;
  link: string;
};

const lojas: Loja[] = [
  {
    id: "drogaria",
    nome: "IA Drogarias",
    imagem: "/shopping/drogaria.png",
    link: "/drogarias",
  },
  {
    id: "mundoverdetour ",
    nome: "Mundo Verde Tour",
    imagem: "/shopping/mundoverde.png",
    link: "/turismo/mundoverdetour",
  },
  {
    id: "gigante",
    nome: "Gigante dos Assados",
    imagem: "/shopping/gigante.png",
    link: "/gigante",
  },
  {
    id: "oggi",
    nome: "Sorveteria Oggi",
    imagem: "/shopping/oggi.png",
    link: "/sorveteria",
  },
  {
    id: "danisound",
    nome: "Dani Sound",
    imagem: "/shopping/danisound.png",
    link: "/autoeletrico/danisound",
  },
  {
    id: "draanne",
    nome: "Dra Anne Dayane",
    imagem: "/shopping/draanne.png",
    link: "/clinicas/draannedayane",
  },
  {
    id: "fisio",
    nome: "FisioPet",
    imagem: "/shopping/fisiopet.png",
    link: "/pet",
  },
  {
    id: "imoveis",
    nome: "Imóveis",
    imagem: "/shopping/imoveis.png",
    link: "/imoveisrapido",
  },
];

export default function Portal3D() {
  const [ativo, setAtivo] = useState("drogaria");
  const router = useRouter();

  function abrirLoja() {
    const loja = lojas.find((l) => l.id === ativo);
    if (loja) router.push(loja.link);
  }

  return (
    <div className="w-full min-h-screen bg-[#050B15] flex flex-col items-center pt-16 gap-14">
      <h1 className="text-4xl font-bold text-white mb-4">
        Shopping IA Drogarias
      </h1>

      {/* ÁREA CENTRAL */}
      <div className="relative w-full flex items-center justify-center">
        {lojas.map((loja) => {
          const pos =
            lojas.indexOf(loja) -
            lojas.indexOf(lojas.find((l) => l.id === ativo)!);

          return (
            <motion.div
              key={loja.id}
              onTap={() => loja.id === ativo && abrirLoja()}
              whileTap={{ scale: 0.96 }}

              animate={{
                scale: loja.id === ativo ? 1 : 0.75,
                opacity: loja.id === ativo ? 1 : 0.4,
                zIndex: loja.id === ativo ? 20 : 5,
                x: pos * 260,
                filter: loja.id === ativo ? "blur(0px)" : "blur(2px)",
              }}
              transition={{ duration: 0.4 }}
            >
              <Image
                src={loja.imagem}
                alt={loja.nome}
                width={450}
                height={300}
                className="rounded-xl border border-cyan-400/40"
              />
            </motion.div>
          );
        })}
      </div>

      {/* BOTÕES INFERIORES */}
      <div className="flex flex-wrap justify-center gap-6 mt-10">
        {lojas.map((loja) => (
          <button
            key={loja.id}
            onClick={() => setAtivo(loja.id)}
            className={`px-5 py-2 rounded-full text-white border transition 
              ${
                ativo === loja.id
                  ? "bg-cyan-500 border-cyan-400"
                  : "bg-transparent border-gray-600"
              }
            `}
          >
            {loja.nome}
          </button>
        ))}
      </div>
    </div>
  );
}
