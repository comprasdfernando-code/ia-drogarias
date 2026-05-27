"use client";

import { useState } from "react";
import DriverControlShell from "../_components/DriverControlShell";
import { calcularKmRodado, calcularLucroLiquido, formatarMoeda } from "../_lib/calculos";

export default function LancamentosPage() {
  const [kmInicial, setKmInicial] = useState(0);
  const [kmFinal, setKmFinal] = useState(0);
  const [bruto, setBruto] = useState(0);
  const [combustivel, setCombustivel] = useState(0);
  const [outros, setOutros] = useState(0);

  const kmRodado = calcularKmRodado(kmInicial, kmFinal);
  const lucro = calcularLucroLiquido(bruto, combustivel, outros);

  return (
    <DriverControlShell>
      <h2 className="mb-4 text-2xl font-bold">Lançamento Diário</h2>

      <div className="grid gap-4 rounded-2xl bg-slate-900 p-5 md:grid-cols-3">
        <input className="rounded-xl bg-slate-800 p-3" type="date" />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Aplicativo: Uber, 99..." />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Veículo" />

        <input className="rounded-xl bg-slate-800 p-3" type="time" />
        <input className="rounded-xl bg-slate-800 p-3" type="time" />

        <input
          className="rounded-xl bg-slate-800 p-3"
          placeholder="KM inicial"
          type="number"
          onChange={(e) => setKmInicial(Number(e.target.value))}
        />

        <input
          className="rounded-xl bg-slate-800 p-3"
          placeholder="KM final"
          type="number"
          onChange={(e) => setKmFinal(Number(e.target.value))}
        />

        <input
          className="rounded-xl bg-slate-800 p-3"
          placeholder="Valor bruto recebido"
          type="number"
          onChange={(e) => setBruto(Number(e.target.value))}
        />

        <input
          className="rounded-xl bg-slate-800 p-3"
          placeholder="Gasto combustível"
          type="number"
          onChange={(e) => setCombustivel(Number(e.target.value))}
        />

        <input
          className="rounded-xl bg-slate-800 p-3"
          placeholder="Outros gastos"
          type="number"
          onChange={(e) => setOutros(Number(e.target.value))}
        />

        <div className="rounded-xl bg-slate-800 p-4 md:col-span-3">
          <p>KM rodado: {kmRodado} km</p>
          <p>Lucro líquido: {formatarMoeda(lucro)}</p>
        </div>

        <button className="rounded-xl bg-green-600 p-3 font-bold md:col-span-3">
          Salvar lançamento
        </button>
      </div>
    </DriverControlShell>
  );
}