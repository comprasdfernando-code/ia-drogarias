import Hero from "./_components/Hero";
import CarrosselServicos from "./_components/CarrosselServicos";
import Servicos from "./_components/Servicos";
import CTAWhats from "./_components/CTAWhats";
import FloatingIA from "./_components/FloatingIA";
import BannerIA from "./_components/BannerIA";

export default function Page() {
  return (
    <main className="relative">
      <Hero />
      <CarrosselServicos />

      {/* BANNER IA (MEIO DO SITE) */}
      <BannerIA />

      <Servicos />
      <CTAWhats />

      {/* BOTÃO FLUTUANTE */}
      <FloatingIA />

      {/* RODAPÉ */}
      <section className="px-6 pb-10 pt-4">
        <div className="mx-auto max-w-5xl border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-zinc-500">
            Desenvolvido por{" "}
            <a
              href="https://iadrogarias.com.br/fv"
              target="_blank"
              className="hover:text-[#d4af37]"
            >
              IA Drogarias
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}