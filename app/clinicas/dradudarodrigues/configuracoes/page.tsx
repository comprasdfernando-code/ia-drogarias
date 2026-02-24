"use client";

import { useState } from "react";

export default function ConfiguracoesPage() {
  const [nome, setNome] = useState("Dra Duda Rodrigues");
  const [whats, setWhats] = useState("");
  const [tema, setTema] = useState("rosé + dourado");

  return (
    <div className="p-6">
      <div className="text-sm text-slate-500">Clínicas / Dra Duda</div>
      <h1 className="text-2xl font-semibold text-slate-900">Configurações</h1>

      <div className="mt-6 rounded-[28px] border bg-slate-100 p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold text-slate-900">Configurações</div>
          <div className="text-sm text-slate-500">
            Dados da clínica, integrações e preferências.
          </div>
        </div>

        <div className="mt-5 rounded-2xl border bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome da clínica">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </Field>

            <Field label="WhatsApp padrão (DDI+DDD+Número)">
              <input
                value={whats}
                onChange={(e) => setWhats(e.target.value)}
                placeholder="Ex: 5511999999999"
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </Field>

            <Field label="Tema">
              <select
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option>rosé + dourado</option>
                <option>neutro (cinza)</option>
                <option>claro</option>
                <option>escuro</option>
              </select>
            </Field>

            <Field label="Integrações">
              <div className="rounded-xl border border-slate-200 p-3 text-sm text-slate-600">
                WhatsApp / E-mail / Assinatura digital (em breve)
              </div>
            </Field>
          </div>

          <div className="mt-5 flex gap-2">
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              Salvar
            </button>
            <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800">
              Restaurar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold text-slate-600">{label}</div>
      {children}
    </div>
  );
}