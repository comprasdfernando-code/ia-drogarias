"use client";

export type ClientePessoa = {
  id: string;
  cpf: string;
  responsavel_nome: string;
  nome_fantasia: string | null;
  whatsapp: string | null;
  email: string | null;
  endereco: string | null;
  ultima_visita: string | null;
  proxima_visita: string | null;
  status_visita: string | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function badgeClass(status?: string | null) {
  const s = (status || "Novo").toLowerCase();
  if (s.includes("visit")) return "bg-green-50 text-green-700 border-green-200";
  if (s.includes("and")) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

export default function ClientList({
  clientes,
  loading = false,
  onMarcarVisita,
  onRemove,
  onCopiarWhats,
}: {
  clientes: ClientePessoa[];
  loading?: boolean;
  onMarcarVisita?: (c: ClientePessoa) => void;
  onRemove?: (id: string) => void;
  onCopiarWhats?: (c: ClientePessoa) => void;
}) {
  if (loading) {
    return <div className="text-gray-600">Carregando...</div>;
  }

  if (!clientes || clientes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
        Nenhum cliente encontrado.
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
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {c.responsavel_nome}
                </h3>

                <span
                  className={`text-xs border px-2 py-1 rounded-full ${badgeClass(
                    c.status_visita
                  )}`}
                >
                  {c.status_visita || "Novo"}
                </span>
              </div>

              <p className="text-sm text-gray-700 mt-1">
                <span className="font-medium">CPF:</span> {c.cpf}
              </p>

              <p className="text-sm text-gray-700">
                <span className="font-medium">Loja:</span>{" "}
                {c.nome_fantasia || "—"}
              </p>

              <p className="text-sm text-gray-700">
                <span className="font-medium">Whats:</span>{" "}
                {c.whatsapp || "—"}
              </p>

              <p className="text-sm text-gray-700">
                <span className="font-medium">Email:</span>{" "}
                {c.email || "—"}
              </p>

              <p className="text-sm text-gray-600 mt-2">
                {c.endereco || "—"}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Última visita:{" "}
                <span className="font-medium">
                  {fmtDate(c.ultima_visita)}
                </span>
                {" • "}
                Próxima:{" "}
                <span className="font-medium">
                  {fmtDate(c.proxima_visita)}
                </span>
              </p>
            </div>

            {onRemove && (
              <button
                onClick={() => onRemove(c.id)}
                className="text-xs rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
              >
                Remover
              </button>
            )}
          </div>

          {(onMarcarVisita || onCopiarWhats) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {onMarcarVisita && (
                <button
                  onClick={() => onMarcarVisita(c)}
                  className="rounded-xl bg-green-600 px-4 py-2 text-white text-sm font-medium hover:bg-green-700"
                >
                  Marcar visita
                </button>
              )}

              {onCopiarWhats && (
                <button
                  onClick={() => onCopiarWhats(c)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Copiar Whats
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
