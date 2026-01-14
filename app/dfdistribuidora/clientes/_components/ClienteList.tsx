"use client";

export type DrogariaCliente = {
  id: string;
  cnpj: string;
  nome_fantasia: string;
  responsavel: string | null;
  telefone: string | null;
  email: string | null;

  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;

  ultima_visita: string | null;  // YYYY-MM-DD
  proxima_visita: string | null; // YYYY-MM-DD
  status_visita: string | null;  // Novo / Em andamento / Visitado
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function endToLine(c: DrogariaCliente) {
  const parts = [c.endereco, c.bairro, c.cidade, c.uf, c.cep].filter(Boolean);
  return parts.length ? parts.join(" - ") : "—";
}

function badgeClass(status?: string | null) {
  const s = (status || "Novo").toLowerCase();
  if (s.includes("visit")) return "bg-green-50 text-green-700 border-green-200";
  if (s.includes("and")) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

export default function ClientList({
  clientes,
  loading,
  onMarcarVisita,
  onRemove,
  onCopiarWhats,
}: {
  clientes: DrogariaCliente[];
  loading?: boolean;
  onMarcarVisita: (c: DrogariaCliente) => void;
  onRemove: (id: string) => void;
  onCopiarWhats?: (c: DrogariaCliente) => void;
}) {
  if (loading) {
    return <div className="text-gray-600">Carregando...</div>;
  }

  if (!clientes?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
        Nenhuma drogaria encontrada.
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
                  {c.nome_fantasia}
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
                <span className="font-medium">CNPJ:</span> {c.cnpj}
              </p>

              <p className="text-sm text-gray-700">
                <span className="font-medium">Responsável:</span>{" "}
                {c.responsavel || "—"}
              </p>

              <p className="text-sm text-gray-700">
                <span className="font-medium">Whats:</span> {c.telefone || "—"}
              </p>

              <p className="text-sm text-gray-700">
                <span className="font-medium">Email:</span> {c.email || "—"}
              </p>

              <p className="text-sm text-gray-600 mt-2">{endToLine(c)}</p>

              <p className="text-xs text-gray-500 mt-2">
                Última visita:{" "}
                <span className="font-medium">{fmtDate(c.ultima_visita)}</span>
                {"  •  "}
                Próxima:{" "}
                <span className="font-medium">{fmtDate(c.proxima_visita)}</span>
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

            {onCopiarWhats ? (
              <button
                onClick={() => onCopiarWhats(c)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Copiar Whats
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
