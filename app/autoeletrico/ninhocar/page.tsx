// app/page.tsx
import Link from "next/link";
import SiteHeader from "./_components/SiteHeader";
import ServiceCards from "./_components/ServiceCards";
import FeaturedProducts from "./_components/FeaturedProducts";
import SiteFooter from "./_components/SiteFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.18),rgba(0,0,0,0))]" />
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-300">
                ⚡ Auto Elétrica + 🔊 Som + ☕ Conveniência
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                NINHO <span className="text-yellow-400">CAR</span> <br />
                Auto Elétrica & Conveniência
              </h1>

              <p className="mt-4 text-zinc-300">
                Diagnóstico rápido, instalação de som e acessórios — e enquanto
                isso você resolve sua vida na conveniência.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/autoeletrico/ninhocar/loja"
                  className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-extrabold text-zinc-950 hover:brightness-110"
                >
                  Ver Loja Virtual
                </Link>

                <a
                  href="https://wa.me/5511954548870?text=Ol%C3%A1%21%20Quero%20um%20or%C3%A7amento%20na%20Ninho%20Car%20🙂"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-bold hover:bg-zinc-800"
                >
                  Falar no WhatsApp
                </a>

                <Link
                  href="/autoeletrico/ninhocar/financeiro"
                  className="rounded-2xl border border-zinc-800 bg-transparent px-5 py-3 text-sm font-bold text-zinc-200 hover:bg-zinc-900"
                >
                  Gestão Financeira
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-zinc-400 sm:grid-cols-4">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3">
                  ✅ Diagnóstico
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3">
                  ✅ Som
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3">
                  ✅ Acessórios
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3">
                  ✅ Conveniência
                </div>
              </div>
            </div>

            {/* Card visual */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-5 shadow-sm">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="text-sm font-extrabold text-yellow-300">
                  Atendimento rápido
                </div>
                <div className="mt-2 text-sm text-zinc-300">
                  Deixe seu carro com a gente e aproveite a conveniência.
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <div className="text-xs text-zinc-400">Serviços</div>
                    <div className="mt-1 text-sm font-extrabold">
                      Elétrica & Som
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <div className="text-xs text-zinc-400">Loja</div>
                    <div className="mt-1 text-sm font-extrabold">
                      Conveniência
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <div className="text-xs text-zinc-400">Contato</div>
                    <div className="mt-1 text-sm font-extrabold">
                      (11) 95454-8870
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <div className="text-xs text-zinc-400">Status</div>
                    <div className="mt-1 text-sm font-extrabold">
                      Aberto hoje
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-yellow-400/10 p-4 text-xs text-yellow-200">
                  Dica: marque produtos com <b>destaque_home=true</b> no Supabase
                  pra aparecerem aqui.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ServiceCards />
      <FeaturedProducts />
      <SiteFooter />
    </div>
  );
}
