"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="w-full py-32 px-6 bg-[#05070A] relative overflow-hidden">

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/10 pointer-events-none" />

      {/* Container principal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="relative max-w-4xl mx-auto flex flex-col items-center text-center"
      >

        {/* LOGO com parallax */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
        >
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src="/tech-fernando-pereira.png"
              alt="Tech Fernando Pereira"
              width={300}
              height={300}
              className="opacity-95 drop-shadow-[0_0_25px_rgba(30,144,255,0.4)]"
            />
          </motion.div>
        </motion.div>

        {/* TITLE */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4 }}
          className="text-4xl md:text-6xl font-extrabold mt-10 leading-tight"
        >
          Tech Fernando Pereira
        </motion.h1>

        {/* SUBTITLE */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6 }}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mt-4"
        >
          Soluções digitais inteligentes para o seu negócio.
        </motion.p>

        {/* CTA BUTTON – GLASS PREMIUM */}
        <motion.a
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.8 }}
          href="https://wa.me/5511964819472?text=Olá!%20Quero%20um%20orçamento%20do%20site%20ou%20sistema."
          className="mt-10 inline-block px-10 py-4 
                     bg-blue-600/80 backdrop-blur-md
                     hover:bg-blue-700/90 
                     rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg
                     border border-white/10"
        >
          Solicitar Orçamento
        </motion.a>

      </motion.div>
    </section>
  );
}
