"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Local = {
  id: string;
  nome: string;
  tipo: string;
  temp_min: number;
  temp_max: number;
};

export default function RegistroTemperaturaPage() {
  const [lojaId, setLojaId] = useState<string>("");
  const [locais, setLocais] = useState<Local[]>([]);
  const [localId, setLocalId] = useState("");
  const [temp, setTemp] = useState<string>("");
  const [umid, setUmid] = useState<string>("");
  const [obs, setObs] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) return;

      // pega primeira loja do usuário (ou use seletor de loja do seu layout)
      const { data: ul } = await supabase
        .from("usuario_lojas")
        .select("loja_id")
        .limit(1)
        .maybeSingle();

      if (!ul?.loja_id) return;
      setLojaId(ul.loja_id);

      const { data: locs } = await supabase
        .from("temp_locais")
        .select("id,nome,tipo,temp_min,temp_max")
        .eq("loja_id", ul.loja_id)
        .eq("ativo", true)
        .order("nome");

      setLocais((locs || []) as any);
      if (locs?.[0]?.id) setLocalId(locs[0].id);
    })();
  }, []);

  const localSel = useMemo(
    () => locais.find((l) => l.id === localId),
    [locais, localId]
  );

  const previewStatus = useMemo(() => {
    const t = Number((temp || "").replace(",", "."));
    if (!localSel || Number.isNaN(t)) return null;
    if (t < localSel.temp_min || t > localSel.temp_max) return "fora";
    if (t < localSel.temp_min + 0.5 || t > localSel.temp_max - 0.5) return "atencao";
    return "ok";
  }, [temp, localSel]);

  async function salvar() {
    if (!lojaId || !localId) return;
    const t = Number((temp || "").replace(",", "."));
    const u = umid ? Number((umid || "").replace(",", ".")) : null;
    if (Number.isNaN(t)) return;

    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();

    const { error } = await supabase.from("temp_leituras").insert({
      loja_id: lojaId,
      local_id: localId,
      temp_c: t,
      umid_pct: u,
      responsavel_user_id: userRes?.user?.id ?? null,
      origem: "manual",
      observacao: obs || null,
      lida_em: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      alert("Erro ao salvar: " + error.message);
      return;
    }

    setTemp("");
    setUmid("");
    setObs("");
    alert("Leitura registrada ✅");
  }

  return (
    <div className="p-4 max-w-xl">
      <h1 className="text-xl font-semibold">Registro de Temperatura</h1>
      <p className="text-sm opacity-80">
        {now.toLocaleString("pt-BR")}
      </p>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-sm">Local</span>
          <select
            className="mt-1 w-full rounded border p-2"
            value={localId}
            onChange={(e) => setLocalId(e.target.value)}
          >
            {locais.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome} ({l.tipo}) — {l.temp_min} a {l.temp_max}°C
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm">Temperatura (°C)</span>
            <input
              className="mt-1 w-full rounded border p-2"
              placeholder="ex: 5,2"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              inputMode="decimal"
            />
          </label>

          <label className="block">
            <span className="text-sm">Umidade (%) (opcional)</span>
            <input
              className="mt-1 w-full rounded border p-2"
              placeholder="ex: 55"
              value={umid}
              onChange={(e) => setUmid(e.target.value)}
              inputMode="decimal"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm">Observação</span>
          <textarea
            className="mt-1 w-full rounded border p-2"
            rows={3}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
          />
        </label>

        {previewStatus && (
          <div className="rounded border p-3 text-sm">
            Status previsto: <b>{previewStatus.toUpperCase()}</b>
            {localSel && (
              <span className="opacity-80">
                {" "}— Padrão: {localSel.temp_min} a {localSel.temp_max}°C
              </span>
            )}
          </div>
        )}

        <button
          onClick={salvar}
          disabled={saving}
          className="w-full rounded bg-black text-white p-3 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Registrar leitura"}
        </button>
      </div>
    </div>
  );
}