// app/dani-sound/servicos/page.tsx
import Link from "next/link";

const servicos = [
  {
    categoria: "Elétrica automotiva",
    itens: [
      "Diagnóstico de curto elétrico",
      "Reparo de alternador",
      "Motor de partida",
      "Falha de carga de bateria",
      "Revisão de chicote elétrico",
    ],
  },
  {
    categoria: "Som & multimídia",
    itens: [
      "Instalação de som completo",
      "Projetos personalizados (mala / caixa)",
      "Módulos, amplificadores, subwoofer",
      "Troca de alto-falantes",
      "Centrais multimídia e câmera de ré",
    ],
  },
  {
    categoria: "Acessórios & iluminação",
    itens: [
      "Kit LED / super LED",
      "Faróis auxiliares / milha",
      "Alarmes e travas elétricas",
      "Vidros elétricos",
      "Outros upgrades sob medida",
    ],
  },
];

export default function ServicosDaniSound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Serviços</h1>
          <p className="text-sm text-zinc-300 max-w-xl mt-1">
            Aqui estão os principais serviços que faço na Dani Sound. Se tiver
            alguma ideia diferente para o seu projeto, chama no Whats que a
            gente desenha junto.
          </p>
        </div>
        <Link
          href="/dani-sound/orcamento"
          className="hidden sm:inline-flex px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold"
        >
          Pedir orçamento
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4 text-sm">
        {servicos.map((s) => (
          <div
            key={s.categoria}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2"
          >
            <h2 className="font-semibold text-zinc-50">{s.categoria}</h2>
            <ul className="text-xs text-zinc-300 space-y-1">
              {s.itens.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-zinc-400">
        Os valores podem variar conforme o modelo e o estado do carro. O ideal é
        enviar modelo, ano e, se possível, uma foto do painel/defeito.
      </div>
    </div>
  );
}
