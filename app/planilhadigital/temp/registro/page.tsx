"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLoja } from "../_components/LojaProvider";

type Local = {
  id: string;
  nome: string;
  temp_min: number;
  temp_max: number;
  umid_min: number | null;
  umid_max: number | null;
};

type Leitura = {
  id: string;
  local_id: string;
  temp_c: number;
  umid_pct: number | null;
  lida_em: string;
  observacao: string | null;
  status: string;
};

function toNum(s: string) {
  const v = Number((s || "").replace(",", "."));
  return Number.isNaN(v) ? null : v;
}

export default function RegistroPage() {
  const { lojaId } = useLoja();

  const [locais, setLocais] = useState<Local[]>([]);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [localId, setLocalId] = useState("");
  const [temp, setTemp] = useState("");
  const [umid, setUmid] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  const localSelecionado = useMemo(
    () => locais.find(l => l.id === localId),
    [locais, localId]
  );

  async function loadLocais() {
    const { data } = await supabase
      .from("temp_locais")
      .select("id,nome,temp_min,temp_max,umid_min,umid_max")
      .eq("loja_id", lojaId)
      .eq("ativo", true)
      .order("nome");

    setLocais(data || []);
    if (!localId && data?.length) setLocalId(data[0].id);
  }

  async function loadMes() {
    const inicio = new Date();
    inicio.setDate(1);
    inicio.setHours(0,0,0,0);

    const { data } = await supabase
      .from("temp_leituras")
      .select("*")
      .eq("loja_id", lojaId)
      .gte("lida_em", inicio.toISOString())
      .order("lida_em", { ascending: false });

    setLeituras(data || []);
  }

  useEffect(() => {
    if (!lojaId) return;
    loadLocais();
    loadMes();
  }, [lojaId]);

  async function salvar() {
    if (!localId) return alert("Selecione o local");
    const t = toNum(temp);
    if (t == null) return alert("Temperatura inválida");

    const u = umid.trim() ? toNum(umid) : null;

    setSaving(true);

    const { error } = await supabase.from("temp_leituras").insert({
      loja_id: lojaId,
      local_id: localId,
      temp_c: t,
      umid_pct: u,
      observacao: obs || null,
      origem: "manual"
    });

    setSaving(false);

    if (error) {
      alert("Erro: " + error.message);
      return;
    }

    setTemp("");
    setUmid("");
    setObs("");
    loadMes();
  }

  function gerarPDF() {
    window.print();
  }

  return (
    <div className="p-4">

      <h1 className="text-xl font-bold">Registro de Temperatura</h1>

      <div className="mt-4 border p-4 rounded">

        <div className="mb-3">
          <label className="text-sm">Local</label>
          <select
            className="w-full border p-2 mt-1"
            value={localId}
            onChange={e => setLocalId(e.target.value)}
          >
            {locais.map(l => (
              <option key={l.id} value={l.id}>{l.nome}</option>
            ))}
          </select>
        </div>

        {localSelecionado && (
          <div className="bg-gray-100 p-3 rounded text-sm mb-3">
            Limite Temp: {localSelecionado.temp_min}°C a {localSelecionado.temp_max}°C <br/>
            Limite Umid: {localSelecionado.umid_min ?? "—"}% a {localSelecionado.umid_max ?? "—"}%
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Temperatura (°C)"
            className="border p-2"
            value={temp}
            onChange={e => setTemp(e.target.value)}
          />
          <input
            placeholder="Umidade (%)"
            className="border p-2"
            value={umid}
            onChange={e => setUmid(e.target.value)}
          />
        </div>

        <textarea
          placeholder="Observação"
          className="border p-2 mt-3 w-full"
          value={obs}
          onChange={e => setObs(e.target.value)}
        />

        <button
          onClick={salvar}
          className="mt-4 bg-black text-white px-4 py-2 rounded"
        >
          {saving ? "Salvando..." : "Registrar"}
        </button>

      </div>

      {/* PLANILHA DO MÊS */}

      <div className="mt-8 border p-4 rounded">

        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Planilha do mês</h2>
          <button onClick={gerarPDF} className="border px-3 py-1 text-sm">
            Gerar PDF
          </button>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Data</th>
              <th className="border p-2">Local</th>
              <th className="border p-2">Temp</th>
              <th className="border p-2">Umid</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Obs</th>
            </tr>
          </thead>
          <tbody>
            {leituras.map(l => {
              const loc = locais.find(x => x.id === l.local_id);
              return (
                <tr key={l.id}>
                  <td className="border p-2">
                    {new Date(l.lida_em).toLocaleString("pt-BR")}
                  </td>
                  <td className="border p-2">{loc?.nome}</td>
                  <td className="border p-2">{l.temp_c}</td>
                  <td className="border p-2">{l.umid_pct ?? "—"}</td>
                  <td className="border p-2 font-bold">
                    {l.status}
                  </td>
                  <td className="border p-2">{l.observacao}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

      </div>

    </div>
  );
}