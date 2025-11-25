import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

export default function PainelHome() {
  return (
    <>
      <Sidebar />

      <div className="ml-64 w-full">
        <Topbar />

        <div className="p-6">
          <h2 className="text-2xl font-bold">Visão Geral</h2>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-[#0A0F16] p-6 rounded-xl border border-white/10">
              <h3 className="text-gray-400 text-sm">Total Fomento</h3>
              <p className="text-3xl font-bold mt-2">R$ 0,00</p>
            </div>

            <div className="bg-[#0A0F16] p-6 rounded-xl border border-white/10">
              <h3 className="text-gray-400 text-sm">Endividamento</h3>
              <p className="text-3xl font-bold mt-2">R$ 0,00</p>
            </div>

            <div className="bg-[#0A0F16] p-6 rounded-xl border border-white/10">
              <h3 className="text-gray-400 text-sm">Vendas</h3>
              <p className="text-3xl font-bold mt-2">0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
