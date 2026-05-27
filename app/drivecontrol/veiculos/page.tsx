"use client";

import { useState } from "react";
import DriverControlShell from "../_components/DriverControlShell";
import { calcularRodizioPorPlaca } from "../_lib/calculos";

export default function VeiculosPage() {
  const [placa, setPlaca] = useState("");
  const rodizio = calcularRodizioPorPlaca(placa);

  return (
    <DriverControlShell>
      <h2 className="mb-4 text-2xl font-bold">Cadastro de Veículo</h2>

      <div className="grid gap-4 rounded-2xl bg-slate-900 p-5 md:grid-cols-3">
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Motorista" />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Marca" />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Modelo" />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Ano" />
        <input
          className="rounded-xl bg-slate-800 p-3"
          placeholder="Placa"
          value={placa}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
        />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Cor" />

        <input className="rounded-xl bg-slate-800 p-3" placeholder="Combustível" />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="KM atual" />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Média KM/L" />

        <div className="rounded-xl bg-slate-800 p-3 md:col-span-3">
          <p>Final da placa: {rodizio.finalPlaca ?? "-"}</p>
          <p>Rodízio: {rodizio.rodizioDia || "-"}</p>
        </div>

        <button className="rounded-xl bg-blue-600 p-3 font-bold md:col-span-3">
          Salvar veículo
        </button>
      </div>
    </DriverControlShell>
  );
}