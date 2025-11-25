import Hero from "./components/Hero";
import Sobre from "./components/Sobre";
import Services from "./components/Services";
import Portfolio from "./components/Portfolio";
import Processo from "./components/Processo";
import Depoimentos from "./components/Depoimentos";
import Contato from "./components/Contato";

export default function Page() {
  return (
    <main className="w-full flex flex-col items-center">
      <Hero />
      <Sobre />
      <Services />
      <Portfolio />
      <Processo />
      <Depoimentos />
      <Contato />
    </main>
  );
}
