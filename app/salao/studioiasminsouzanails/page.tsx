import Hero from "./_components/Hero";
import Servicos from "./_components/Servicos";
import CTAWhats from "./_components/CTAWhats";

export default function Page() {
  return (
    <main className="relative">
      <Hero />
      <Servicos />
      <CTAWhats />
    </main>
  );
}