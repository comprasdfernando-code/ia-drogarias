"use client";

import { useMemo, useState } from "react";

type Cliente = {
  id: string;
  nome: string;
  telefone?: string;
  ultimaConsulta?: string;
  classificacao: "ouro" | "ativo" | "risco";
  observacao?: string;
};

const seed: Cliente[] = [
  { id: "1", nome: "Maria Silva", telefone: "11 9xxxx-xxxx", ultimaConsulta: "2026-02-10", classificacao: "ouro" },
  { id: "2", nome: "João Pereira", telefone: "11 9xxxx-xxxx", ultimaConsulta: "2026-01-12", classificacao: "risco" },
  { id: "3", nome: "Ana Souza", telefone: "11 9xxxx-xxxx", ultimaConsulta: "2026-02-18", classificacao: "ativo" },
];

export default function CRMPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"todos" | Cliente["classificacao"]>("todos");

  const list = useMemo(() => {
    return seed
      .filter((c) => (tab === "todos" ? true : c.classificacao === tab))
      .filter((c) => !q || c.nome.toLowerCase().includes(q.toLowerCase()));
  }, [q, tab]);

  return (
    <div className="p-6">
      <div className="text-sm text-slate-500">Clínicas / Dra Duda</div>
      <h1 className="text-2xl font-semibold text-slate-900">CRM</h1>

      <div className="mt-6 rounded-[28px] border bg-slate-100 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-semibold text-slate-900">Clientes</div>
            <div className="text-sm text-slate-500">Classificação e histórico (MVP).</div>
          </div>

          <div className="flex gap-2">
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              Novo cliente
            </button>
            <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800">
              Importar
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <Tab label="todos" active={tab === "todos"} onClick={() => setTab("todos")} />
              <Tab label="ouro" active={tab === "ouro"} onClick={() => setTab("ouro")} />
              <Tab label="ativo" active={tab === "ativo"} onClick={() => setTab("ativo")} />
              <Tab label="risco" active={tab === "risco"} onClick={() => setTab("risco")} />
            </div>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome do cliente..."
              className="w-full md:w-[520px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border">
            <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
              <div className="col-span-4">Cliente</div>
              <div className="col-span-3">Telefone</div>
              <div className="col-span-3">Última consulta</div>
              <div className="col-span-2 text-right">Classificação</div>
            </div>

            {list.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                Nenhum cliente encontrado.
              </div>
            ) : (
              <div className="divide-y">
                {list.map((c) => (
                  <div key={c.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                    <div className="col-span-4 font-medium text-slate-900">{c.nome}</div>
                    <div className="col-span-3 text-slate-600">{c.telefone || "-"}</div>
                    <div className="col-span-3 text-slate-600">{c.ultimaConsulta || "-"}</div>
                    <div className="col-span-2 flex justify-end">
                      <Badge value={c.classificacao} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Próximo passo: abrir perfil do paciente e puxar histórico / retornos / mensagens.
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

function Badge({ value }: { value: "ouro" | "ativo" | "risco" }) {
  const map = {
    ouro: "bg-amber-50 text-amber-700",
    ativo: "bg-emerald-50 text-emerald-700",
    risco: "bg-rose-50 text-rose-700",
  } as const;
  return <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${map[value]}`}>{value}</span>;
}