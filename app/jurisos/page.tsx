// app/jurisos/page.tsx

import Sidebar from "@/components/jurisos/Sidebar";
import Header from "@/components/jurisos/Header";
import DashboardCard from "@/components/jurisos/DashboardCard";
import JurisIABox from "@/components/jurisos/JurisIABox";

export default function JurisOSPage() {
  return (
    <main className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <section className="flex flex-1 flex-col">
        <Header />

        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900">
              Bom dia, Dr. Marcos
            </h1>
            <p className="mt-2 text-slate-500">
              Aqui está o resumo inteligente do seu escritório hoje.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <DashboardCard title="Processos Ativos" value="128" color="bg-blue-600" />
            <DashboardCard title="Prazos Hoje" value="5" color="bg-red-500" />
            <DashboardCard title="Audiências" value="3" color="bg-amber-500" />
            <DashboardCard title="Honorários" value="R$ 82.450" color="bg-green-500" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <section className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-2xl font-bold text-slate-900">
                Últimas movimentações
              </h2>

              {[
                "Nova decisão no processo 1002458-33.2024.8.26.0001",
                "Prazo de contestação vence hoje às 18h",
                "Cliente Carlos enviou novos documentos",
                "Audiência trabalhista amanhã às 14h",
              ].map((item) => (
                <div
                  key={item}
                  className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </section>

            <JurisIABox />
          </div>
        </div>
      </section>
    </main>
  );
}