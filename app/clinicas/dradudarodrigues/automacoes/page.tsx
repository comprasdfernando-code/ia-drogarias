"use client";

import { useMemo, useState } from "react";

type Status = "ativa" | "pausada";

type Regra = {
  id: string;
  nome: string;
  gatilho: string;
  acao: string;
  status: Status;
};

const seed: Regra[] = [
  {
    id: "1",
    nome: "Lembrete 24h antes",
    gatilho: "Consulta agendada para amanhã",
    acao: "Enviar WhatsApp para paciente",
    status: "ativa",
  },
  {
    id: "2",
    nome: "Pós-procedimento",
    gatilho: "Consulta marcada como concluída",
    acao: "Enviar orientações + retorno em 7 dias",
    status: "pausada",
  },
];

export default function AutomacoesPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"todas" | Status>("todas");
  const [regras, setRegras] = useState<Regra[]>(seed);

  const filtradas = useMemo(() => {
    const base = regras.filter((r) => {
      const okTab = tab === "todas" ? true : r.status === tab;
      const okQ =
        !q ||
        (r.nome + " " + r.gatilho + " " + r.acao).toLowerCase().includes(q.toLowerCase());
      return okTab && okQ;
    });
    return base;
  }, [regras, tab, q]);

  function toggleStatus(id: string) {
    setRegras((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === "ativa" ? "pausada" : "ativa" } : r
      )
    );
  }

  return (
    <div className="p-6">
      <div className="text-sm text-slate-500">Clínicas / Dra Duda</div>
      <h1 className="text-2xl font-semibold text-slate-900">Automações</h1>

      <div className="mt-6 rounded-[28px] border bg-slate-100 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-semibold text-slate-900">Automações</div>
            <div className="text-sm text-slate-500">
              Regras automáticas de lembretes, pós-consulta e rotinas.
            </div>
          </div>

          <div className="flex gap-2">
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              Nova regra
            </button>
            <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800">
              Modelos
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <Tab label="todas" active={tab === "todas"} onClick={() => setTab("todas")} />
              <Tab label="ativa" active={tab === "ativa"} onClick={() => setTab("ativa")} />
              <Tab
                label="pausada"
                active={tab === "pausada"}
                onClick={() => setTab("pausada")}
              />
            </div>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por regra, gatilho ou ação..."
              className="w-full md:w-[520px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border">
            <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
              <div className="col-span-3">Regra</div>
              <div className="col-span-4">Gatilho</div>
              <div className="col-span-4">Ação</div>
              <div className="col-span-1 text-right">Status</div>
            </div>

            {filtradas.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                Nenhuma automação encontrada.
              </div>
            ) : (
              <div className="divide-y">
                {filtradas.map((r) => (
                  <div key={r.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                    <div className="col-span-3 font-medium text-slate-900">{r.nome}</div>
                    <div className="col-span-4 text-slate-600">{r.gatilho}</div>
                    <div className="col-span-4 text-slate-600">{r.acao}</div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => toggleStatus(r.id)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                          r.status === "ativa"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                        title="Alternar status"
                      >
                        {r.status}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Dica: depois a gente liga essas regras com Agenda + WhatsApp (e-mail opcional).
          </div>
        </div>
      </div>
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-semibold ${
        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}