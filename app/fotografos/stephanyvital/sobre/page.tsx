// /app/fotografos/stephanyvital/sobre/page.tsx
"use client";

import { motion } from "framer-motion";

export default function SobreStephany() {
  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">

      {/* TÍTULO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-6 md:mt-10 text-center"
      >
        <h1 className="text-3xl md:text-4xl font-semibold text-[#C8A49B]">
          Sobre a Stephany
        </h1>
        <p className="mt-3 text-gray-600">
          Fotografia leve, romântica e sensível — feita para revelar a sua essência.
        </p>
      </motion.div>

      {/* BLOCO FOTO + TEXTO */}
      <section className="mt-10 md:mt-14 grid md:grid-cols-2 gap-10 items-center">
        
        {/* FOTO DELA */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <div className="rounded-3xl overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
            <img
              src="/stephany/sobre-stephany.jpg"
              alt="Stephany Vital Fotografia"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -right-5 bg-[#F7E8E5] text-[#C8A49B] px-4 py-3 rounded-2xl shadow-md text-sm font-medium">
            + de  •  ensaios realizados
          </div>
        </motion.div>

        {/* TEXTO PRINCIPAL */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-gray-700 leading-relaxed text-base md:text-lg"
        >
          <p>
            Eu sempre fui apaixonada por registrar sentimentos. Antes mesmo de
            pensar na fotografia como profissão, já guardava momentos em imagens,
            tentando congelar aquilo que o coração sentia.
          </p>

          <p className="mt-4">
            Hoje, através da <span className="font-semibold text-[#C8A49B]">Stephany Vital Fotografia</span>, 
            transformo essa paixão em encontros cheios de leveza, carinho e verdade.
            Cada ensaio é planejado com muito cuidado, para que você se sinta
            acolhida, confiante e linda — exatamente do seu jeitinho.
          </p>

          <p className="mt-4">
            Minha fotografia é romântica, delicada e emocional.  
            Gosto de luz natural, gestos sutis, risadas espontâneas e olhares
            sinceros. Mais do que poses perfeitas, busco capturar aquilo que é
            real em você.
          </p>

          <p className="mt-4">
            Se você sonha com um ensaio que traduza a sua essência, vou ter um
            enorme prazer em viver esse momento ao seu lado.
          </p>
        </motion.div>
      </section>

      {/* VALORES / DIFERENCIAIS */}
      <section className="mt-16">
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-semibold text-center text-[#C8A49B]"
        >
          Meu jeito de fotografar
        </motion.h2>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl shadow-sm border border-[#F3D9D3] p-5 text-center"
          >
            <p className="text-sm font-semibold text-[#C8A49B] uppercase tracking-[0.2em]">
              Leveza
            </p>
            <p className="mt-3 text-gray-700 text-sm">
              Um ambiente acolhedor, com direção carinhosa, para você se sentir
              segura e à vontade em cada clique.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl shadow-sm border border-[#F3D9D3] p-5 text-center"
          >
            <p className="text-sm font-semibold text-[#C8A49B] uppercase tracking-[0.2em]">
              Sensibilidade
            </p>
            <p className="mt-3 text-gray-700 text-sm">
              Olhar atento aos detalhes, gestos e emoções, para registrar aquilo
              que faz a sua história única.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl shadow-sm border border-[#F3D9D3] p-5 text-center"
          >
            <p className="text-sm font-semibold text-[#C8A49B] uppercase tracking-[0.2em]">
              Verdade
            </p>
            <p className="mt-3 text-gray-700 text-sm">
              Fotografias que respeitam quem você é, sem excessos — naturais,
              delicadas e cheias de significado.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CHAMADO FINAL */}
      <section className="mt-16 md:mt-20 text-center bg-[#FDF3EF] rounded-3xl py-10 px-6">
        <motion.h3
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-semibold text-[#C8A49B]"
        >
          Vamos viver esse momento juntas?
        </motion.h3>

        <p className="mt-4 text-gray-700 max-w-xl mx-auto">
          Se você sente que esse estilo de fotografia combina com você,
          será uma alegria enorme poder registrar a sua história.
        </p>

        <a
          href="https://wa.me/5512992238306"
          target="_blank"
          className="inline-block mt-6 px-8 py-3 bg-[#C8A49B] text-white font-semibold rounded-full hover:bg-[#b98f86] transition"
        >
          Falar com a Stephany
        </a>
      </section>
    </div>
  );
}
