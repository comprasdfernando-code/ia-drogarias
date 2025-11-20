// app/turismo/mundoverdetour/page.tsx
import Hero from "./components/Hero";
import Sobre from "./components/Sobre";
import Servicos from "./components/Servicos";
import TransporteDestaque from "./components/TransporteDestaque";
import Galeria from "./components/Galeria";
import Contato from "./components/Contato";
import BotaoTransporte from "./components/BotaoTransporte";

export default function MundoVerdeTourPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-green-50 text-slate-900">
      <Hero />
      <Sobre />
      <Servicos />
      <TransporteDestaque />
      <Galeria />
      <Contato />
      <BotaoTransporte />
    </main>
  );
}