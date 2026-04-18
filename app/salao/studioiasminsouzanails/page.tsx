import Hero from "./_components/Hero";
import CarrosselServicos from "./_components/CarrosselServicos";
import Servicos from "./_components/Servicos";
import CTAWhats from "./_components/CTAWhats";

export default function Page() {
  return (
    <main className="relative">
      <Hero />
      <CarrosselServicos />
      <Servicos />
      <CTAWhats />
    </main>
  );
}