// /app/fotografos/stephanyvital/page.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function StephanyHome() {
  return (
    <div>

      {/* ================= HERO ================= */}
      <section className="relative w-full h-[80vh] md:h-[90vh] flex items-center justify-center overflow-hidden">

        {/* FOTO DO HERO */}
        <img
          src="/stephany/hero.jpg" 
          alt="Stephany Vital Fotografia"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* DEGRADÊ */}
        <div className="absolute inset-0 hero-gradient"></div>

        {/* TEXTO PRINCIPAL */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="z-20 text-center text-white px-4"
        >
          <h1 className="text-4xl md:text-6xl font-semibold drop-shadow-lg">
            Momentos que se transformam em eternidade.
          </h1>

          <p className="mt-4 text-lg md:text-xl opacity-90 font-light">
            Retratos femininos, gestante e família — com sensibilidade e verdade.
          </p>

          {/* BOTÕES */}
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/fotografos/stephanyvital/portfolio">
              <button className="px-6 py-3 bg-white text-[#C8A49B] font-semibold rounded-full shadow-xl hover:bg-[#F7E8E5] transition">
                Ver Portfólio
              </button>
            </Link>

            <a
              href="https://wa.me/5512992238306"
              target="_blank"
              className="px-6 py-3 border border-white text-white font-semibold rounded-full hover:bg-white hover:text-[#C8A49B] transition"
            >
              Agendar Ensaio
            </a>
          </div>
        </motion.div>
      </section>

      {/* ================= SOBRE RÁPIDO ================= */}
      <section className="max-w-5xl mx-auto mt-20 px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-semibold text-[#C8A49B]"
        >
          Sobre Mim
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-4 text-gray-700 leading-relaxed text-lg"
        >
          Minha fotografia é leve, romântica e sensível.  
          Acredito que cada mulher tem uma beleza única — e minha missão é revelá-la através das lentes.
        </motion.p>

        <Link href="/fotografos/stephanyvital/sobre">
          <button className="mt-6 px-6 py-3 bg-[#C8A49B] text-white rounded-full hover:bg-[#b98f86] transition">
            Conheça mais
          </button>
        </Link>
      </section>

      {/* ================= MINI PORTFÓLIO (CATEGORIAS) ================= */}
      <section className="max-w-6xl mx-auto mt-24 px-4">
        
        <h3 className="text-center text-3xl font-semibold text-[#C8A49B]">
          Portfólio
        </h3>

        <p className="text-center text-gray-600 mt-3">
          Escolha o estilo que mais combina com você
        </p>

        <div className="grid md:grid-cols-4 gap-6 mt-12">

          {/* FEMININO */}
          <Link href="/fotografos/stephanyvital/portfolio/feminino">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="relative rounded-xl overflow-hidden cursor-pointer"
            >
              <img
                src="/stephany/feminino.jpg"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <p className="text-white text-xl font-semibold drop-shadow-lg">
                  Feminino
                </p>
              </div>
            </motion.div>
          </Link>

          {/* GESTANTE */}
          <Link href="/fotografos/stephanyvital/portfolio/gestante">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="relative rounded-xl overflow-hidden cursor-pointer"
            >
              <img
                src="/stephany/gestante.jpg"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <p className="text-white text-xl font-semibold drop-shadow-lg">
                  Gestante
                </p>
              </div>
            </motion.div>
          </Link>

          {/* FAMÍLIA */}
          <Link href="/fotografos/stephanyvital/portfolio/familia">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="relative rounded-xl overflow-hidden cursor-pointer"
            >
              <img
                src="/stephany/familia.jpg"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <p className="text-white text-xl font-semibold drop-shadow-lg">
                  Família
                </p>
              </div>
            </motion.div>
          </Link>

          {/* CASAL */}
          <Link href="/fotografos/stephanyvital/portfolio/casal">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="relative rounded-xl overflow-hidden cursor-pointer"
            >
              <img
                src="/stephany/casal.jpg"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <p className="text-white text-xl font-semibold drop-shadow-lg">
                  Casal
                </p>
              </div>
            </motion.div>
          </Link>

        </div>
      </section>

      {/* ==== CHAMADO PARA AGENDAMENTO ==== */}
      <section className="mt-28 text-center px-4 pb-20">
        <h3 className="text-3xl font-semibold text-[#C8A49B]">
          Vamos criar algo lindo juntas?
        </h3>

        <p className="mt-4 text-gray-700 text-lg">
          Entre em contato e receba o atendimento completo no WhatsApp.
        </p>

        <a
          href="https://wa.me/5512992238306"
          target="_blank"
          className="inline-block mt-6 px-8 py-4 bg-[#C8A49B] text-white font-semibold rounded-full hover:bg-[#b98f86] transition"
        >
          Agendar Agora
        </a>
      </section>
    </div>
  );
}
