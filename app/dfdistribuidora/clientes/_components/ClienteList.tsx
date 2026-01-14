"use client";

import type { Cliente } from "../page";

function formatDate(d?: string) {
  if (!d) return "—";
  // YYYY-MM-DD -> DD/MM/YYYY
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

export default function ClienteList({
  clientes,
  onRemove,
  onMarcarVisita,
  onCopiarWhats,
}: {
  clientes: Cliente[];
  onRemove: (id: string) => void;
  onMarcarVisita: (c: Cliente) => void;
  onCopiarWhats: (c: Cliente) => void;
}) {
  if (!clientes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
        Nenhum cliente cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {clientes.map((c) => (
        <div
          key={c.id}
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{c.nome}</h3>
              <p className="text-sm text-gray-600 mt-1">{c.endereco}</p>
              <p className="text-sm text-gray-700 mt-2">
                <span className="font-medium">Whats:</span> {c.whatsapp}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Contato:</span> {c.contato || "—"}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Última visita: <span className="font-medium">{formatDate(c.ultimaVisita)}</span>
              </p>
            </div>

            <button
              onClick={() => onRemove(c.id)}
              className="text-xs rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
              title="Remover"
            >
              Remover
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => onMarcarVisita(c)}
              className="rounded-xl bg-green-600 px-4 py-2 text-white text-sm font-medium hover:bg-green-700"
            >
              Marcar visita
            </button>

            <button
              onClick={() => onCopiarWhats(c)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Copiar Whats
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
