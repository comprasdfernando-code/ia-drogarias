"use client";

import { useLoja } from "./LojaProvider";

export default function LojaSelectTop() {
  const { lojaId, setLojaId, lojas, role, loading } = useLoja();

  if (loading) {
    return (
      <div className="mb-4 rounded border p-3 text-sm opacity-70">
        Carregando lojas…
      </div>
    );
  }

  if (!lojas.length) {
    return (
      <div className="mb-4 rounded border p-3 text-sm">
        Nenhuma loja vinculada ao usuário em <b>usuario_lojas</b>.
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between rounded border p-3">
      <div className="text-sm">
        Loja ativa: <b>{lojas.find((l) => l.id === lojaId)?.nome || lojaId}</b>{" "}
        <span className="opacity-70">• Perfil: {role}</span>
      </div>

      {lojas.length > 1 ? (
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-70">Trocar:</span>
          <select
            className="rounded border p-2 text-sm"
            value={lojaId}
            onChange={(e) => setLojaId(e.target.value)}
          >
            {lojas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome} ({l.role})
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}