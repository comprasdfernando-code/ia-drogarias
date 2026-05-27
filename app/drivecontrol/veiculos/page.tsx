"use client";

import { useEffect, useState } from "react";
import DriverControlShell from "../_components/DriverControlShell";
import { calcularRodizioPorPlaca } from "../_lib/calculos";
import { supabase } from "../_lib/supabaseClient";

type Veiculo = {
  id: string;
  motorista: string | null;
  marca: string;
  modelo: string;
  ano: number | null;
  placa: string | null;
  cor: string | null;
  combustivel: string | null;
  km_atual: number | null;
  media_km_l: number | null;
  rodizio_dia: string | null;
};

export default function VeiculosPage() {
  const [carregando, setCarregando] = useState(false);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);

  const [form, setForm] = useState({
    motorista: "",
    marca: "",
    modelo: "",
    ano: "",
    placa: "",
    cor: "",
    combustivel: "",
    km_atual: "",
    media_km_l: "",
    tanque_litros: "",
    observacoes: "",
  });

  const rodizio = calcularRodizioPorPlaca(form.placa);

  function alterar(campo: string, valor: string) {
    setForm((prev) => ({
      ...prev,
      [campo]: campo === "placa" ? valor.toUpperCase() : valor,
    }));
  }

  async function buscarVeiculos() {
    const { data, error } = await supabase
      .from("drivercontrol_veiculos")
      .select("*")
      .eq("ativo", true)
      .order("created_at", { ascending: false });

    if (!error) setVeiculos(data || []);
  }

  async function salvarVeiculo() {
    if (!form.marca || !form.modelo) {
      alert("Preencha marca e modelo.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.from("drivercontrol_veiculos").insert({
      motorista: form.motorista || null,
      marca: form.marca,
      modelo: form.modelo,
      ano: form.ano ? Number(form.ano) : null,
      placa: form.placa || null,
      cor: form.cor || null,
      combustivel: form.combustivel || null,
      km_atual: form.km_atual ? Number(form.km_atual) : 0,
      media_km_l: form.media_km_l ? Number(form.media_km_l) : 0,
      tanque_litros: form.tanque_litros ? Number(form.tanque_litros) : 0,
      final_placa: rodizio.finalPlaca,
      rodizio_dia: rodizio.rodizioDia,
      observacoes: form.observacoes || null,
    });

    setCarregando(false);

    if (error) {
      alert("Erro ao salvar veículo: " + error.message);
      return;
    }

    setForm({
      motorista: "",
      marca: "",
      modelo: "",
      ano: "",
      placa: "",
      cor: "",
      combustivel: "",
      km_atual: "",
      media_km_l: "",
      tanque_litros: "",
      observacoes: "",
    });

    buscarVeiculos();
  }

  useEffect(() => {
    buscarVeiculos();
  }, []);

  return (
    <DriverControlShell>
      <h2 className="mb-4 text-2xl font-bold">Cadastro de Veículo</h2>

      <div className="grid gap-4 rounded-2xl bg-slate-900 p-5 md:grid-cols-3">
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Motorista" value={form.motorista} onChange={(e) => alterar("motorista", e.target.value)} />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Marca" value={form.marca} onChange={(e) => alterar("marca", e.target.value)} />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Modelo" value={form.modelo} onChange={(e) => alterar("modelo", e.target.value)} />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Ano" value={form.ano} onChange={(e) => alterar("ano", e.target.value)} />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Placa" value={form.placa} onChange={(e) => alterar("placa", e.target.value)} />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Cor" value={form.cor} onChange={(e) => alterar("cor", e.target.value)} />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Combustível" value={form.combustivel} onChange={(e) => alterar("combustivel", e.target.value)} />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="KM atual" value={form.km_atual} onChange={(e) => alterar("km_atual", e.target.value)} />
        <input className="rounded-xl bg-slate-800 p-3" placeholder="Média KM/L" value={form.media_km_l} onChange={(e) => alterar("media_km_l", e.target.value)} />

        <div className="rounded-xl bg-slate-800 p-3 md:col-span-3">
          <p>Final da placa: {rodizio.finalPlaca ?? "-"}</p>
          <p>Rodízio: {rodizio.rodizioDia || "-"}</p>
        </div>

        <button onClick={salvarVeiculo} disabled={carregando} className="rounded-xl bg-blue-600 p-3 font-bold md:col-span-3">
          {carregando ? "Salvando..." : "Salvar veículo"}
        </button>
      </div>

      <h3 className="mt-8 mb-3 text-xl font-bold">Veículos cadastrados</h3>

      <div className="grid gap-3">
        {veiculos.map((v) => (
          <div key={v.id} className="rounded-xl bg-slate-900 p-4">
            <strong>{v.marca} {v.modelo} {v.ano}</strong>
            <p className="text-sm text-slate-400">
              Placa: {v.placa || "-"} • Rodízio: {v.rodizio_dia || "-"}
            </p>
          </div>
        ))}
      </div>
    </DriverControlShell>
  );
}