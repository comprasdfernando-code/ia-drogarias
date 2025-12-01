export const dynamic = "force-static";

import Link from "next/link";

export default function AvaliaMedicLogin() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl border rounded-2xl p-10 w-full max-w-md">

        {/* LOGO / TÍTULO */}
        <h1 className="text-3xl font-semibold text-emerald-700 text-center">
          AvaliaMedic
        </h1>
        <p className="text-center text-gray-600 mt-1">
          Inteligência em Saúde
        </p>

        {/* FORM */}
        <form className="mt-8 space-y-5">

          {/* E-mail */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              E-mail hospitalar
            </label>
            <input
              type="email"
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
              placeholder="seu.email@hospital.com"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
              placeholder="Digite sua senha"
            />
          </div>

          {/* Setor */}
          <div>
            <label className="text-sm font-medium text-gray-700">Setor</label>
            <select className="w-full mt-1 p-3 border rounded-lg bg-white focus:ring-2 focus:ring-emerald-600 outline-none">
              <option>Pronto Atendimento</option>
              <option>UTI</option>
              <option>UTI Neonatal</option>
              <option>Obstetrícia</option>
              <option>Internação</option>
              <option>Farmácia Clínica</option>
            </select>
          </div>

          {/* Botão */}
          <button
            type="submit"
            className="w-full bg-emerald-700 text-white p-3 rounded-lg font-medium hover:bg-emerald-800 transition"
          >
            Entrar
          </button>
        </form>

        {/* LINK VOLTAR */}
        <div className="text-center mt-6">
          <Link
            href="/avaliamedic"
            className="text-emerald-700 hover:underline font-medium"
          >
            ← Voltar
          </Link>
        </div>
      </div>
    </main>
  );
}
