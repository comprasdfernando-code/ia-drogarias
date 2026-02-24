"use client";

import { useLoja } from "./LojaProvider";

export default function LojaSelectTop() {
  const { lojas, lojaId, role } = useLoja();
  const loja = lojas.find((l) => l.id === lojaId);

  return (
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between rounded border p-3">
      <div className="text-sm">
        Loja ativa: <b>{loja?.nome || lojaId}</b>{" "}
        <span className="opacity-70">• Perfil: {role}</span>
      </div>

      <div className="text-xs opacity-70">
        Modo demo: loja fixa (sem multi-loja)
      </div>
    </div>
  );
}