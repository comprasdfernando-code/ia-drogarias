// /app/fotografos/stephanyvital/portfolio/page.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PortfolioStephany() {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-20">

      {/* TÍTULO */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-10 text-center"
      >
        <h1 className="text-3xl md:text-4xl font-semibold text-[#C8A49B]">
          Portfólio
        </h1>

        <p className="mt-3 text-gray-600 text-lg">
          A beleza de cada história em imagens que falam por si
        </p>
      </motion.div>

      {/* GRID DE CATEGORIAS */}
      <div className="grid md:grid-cols-2 gap-8 mt-14">

        {/* FEMININO */}
        <Link href="/fotografos/stephanyvital/portfolio/feminino">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative rounded-3xl overflow-hidden cursor-pointer shadow-md"
          >
            <img
              src="/stephany/feminino.jpg"
              alt="Ensaio Feminino"
              className="w-full h-80 object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-end p-6">
              <p className="text-white text-2xl font-semibold">
                Ensaio Feminino
              </p>
            </div>
          </motion.div>
        </Link>

        {/* GESTANTE */}
        <Link href="/fotografos/stephanyvital/portfolio/gestante">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative rounded-3xl overflow-hidden cursor-pointer shadow-md"
          >
            <img
              src="/stephany/gestante.jpg"
              alt="Ensaio Gestante"
              className="w-full h-80 object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-end p-6">
              <p className="text-white text-2xl font-semibold">
                Gestante
              </p>
            </div>
          </motion.div>
        </Link>

        {/* FAMÍLIA */}
        <Link href="/fotografos/stephanyvital/portfolio/familia">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative rounded-3xl overflow-hidden cursor-pointer shadow-md"
          >
            <img
              src="/stephany/familia.jpg"
              alt="Ensaio Família"
              className="w-full h-80 object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-end p-6">
              <p className="text-white text-2xl font-semibold">
                Família
              </p>
            </div>
          </motion.div>
        </Link>

        {/* CASAL */}
        <Link href="/fotografos/stephanyvital/portfolio/casal">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative rounded-3xl overflow-hidden cursor-pointer shadow-md"
          >
            <img
              src="/stephany/casal.jpg"
              alt="Ensaio de Casal"
              className="w-full h-80 object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-end p-6">
              <p className="text-white text-2xl font-semibold">
                Casal
              </p>
            </div>
          </motion.div>
        </Link>

      </div>

      {/* CHAMADO FINAL */}
      <section className="mt-20 text-center">
        <h3 className="text-2xl font-semibold text-[#C8A49B]">
          Gostou de algum estilo?
        </h3>
        <p className="mt-3 text-gray-700">
          Fale comigo e vamos planejar seu ensaio do jeitinho que você sempre sonhou.
        </p>

        <a
          href="https://wa.me/5512992238306"
          target="_blank"
          className="inline-block mt-6 px-8 py-4 bg-[#C8A49B] text-white font-semibold rounded-full hover:bg-[#b98f86] transition"
        >
          Agendar Ensaio
        </a>
      </section>

    </div>
  );
}
