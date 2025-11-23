export const dynamic = "force-static";

import "./styles.css";
import Image from "next/image";
import Link from "next/link";
import HeaderDanisound from "./HeaderDanisound";

export const metadata = {
  title: "Dani Sound - Auto Elétrico & Som Automotivo",
  description:
    "Auto elétrico, multimídia, LED, alarme, bloqueador, travas elétricas e som automotivo profissional na Av. Rodolfo Pirani.",
};

export default function DaniSoundLayout({ children }) {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage: 'url("/danisound/bg-neon.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* HEADER – agora um componente CLIENT */}
      <HeaderDanisound />

      {/* CONTEÚDO */}
      <main className="max-w-6xl mx-auto px-4 py-10">{children}</main>

      {/* FOOTER */}
      <footer className="text-center text-sm py-10 opacity-70">
        <span>
          © {new Date().getFullYear()} Dani Sound – Desenvolvido com IA ❤️⚡
        </span>
      </footer>

      {/* BOTÃO FLUTUANTE */}
      <a
        href="https://wa.me/5511977844066?text=Olá,+quero+um+orçamento!"
        target="_blank"
        className="fixed bottom-5 right-5 bg-green-500 shadow-xl shadow-green-600/40 hover:bg-green-600 px-5 py-3 rounded-full font-bold"
      >
        WhatsApp
      </a>
    </div>
  );
}
