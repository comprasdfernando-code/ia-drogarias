"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLoja } from "../_components/LojaProvider";

type Local = {
  id: string;
  nome: string;
  tipo: string;
  temp_min: number;
  temp_max: number;
  umid_min: number | null;
  umid_max: number | null;
  ativo: boolean;
};

type Leitura = {
  id: string;
  local_id: string;
  temp_c: number;
  umid_pct: number | null;
  lida_em: string;
  observacao: string | null;
  status: string;
  turno?: string | null; // manha | tarde
  assinatura?: string | null; // nome do responsável
};

function toNum(s: string) {
  const v = Number((s || "").replace(",", "."));
  return Number.isNaN(v) ? null : v;
}

function monthStartISO() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function monthLabelPtBr() {
  const d = new Date();
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default function RegistroTempPage() {
  const { lojaId } = useLoja();

  const [locais, setLocais] = useState<Local[]>([]);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [localId, setLocalId] = useState("");

  const [turno, setTurno] = useState<"manha" | "tarde">("manha");
  const [assinatura, setAssinatura] = useState("");
  const [temp, setTemp] = useState("");
  const [umid, setUmid] = useState("");
  const [obs, setObs] = useState("");

  const [loadingLocais, setLoadingLocais] = useState(true);
  const [loadingMes, setLoadingMes] = useState(true);
  const [saving, setSaving] = useState(false);

  const localSel = useMemo(() => locais.find((l) => l.id === localId) || null, [locais, localId]);

  async function loadLocais() {
    if (!lojaId) return;
    setLoadingLocais(true);

    const { data, error } = await supabase
      .from("temp_locais")
      .select("id,nome,tipo,temp_min,temp_max,umid_min,umid_max,ativo")
      .eq("loja_id", lojaId)
      .order("nome", { ascending: true });

    if (error) {
      console.error(error);
      setLocais([]);
      setLoadingLocais(false);
      return;
    }

    const arr = (data || []) as Local[];
    const ativos = arr.filter((x) => x.ativo !== false); // se ativo for null, considera ativo
    setLocais(ativos);

    if (!localId && ativos.length) setLocalId(ativos[0].id);
    setLoadingLocais(false);
  }

  async function loadMes() {
    if (!lojaId) return;
    setLoadingMes(true);

    const { data, error } = await supabase
      .from("temp_leituras")
      .select("id,local_id,temp_c,umid_pct,lida_em,observacao,status,turno,assinatura")
      .eq("loja_id", lojaId)
      .gte("lida_em", monthStartISO())
      .order("lida_em", { ascending: false })
      .limit(5000);

    if (error) {
      console.error(error);
      setLeituras([]);
      setLoadingMes(false);
      return;
    }

    setLeituras((data || []) as any);
    setLoadingMes(false);
  }

  useEffect(() => {
    if (!lojaId) return;

    loadLocais();
    loadMes();

    const ch = supabase
      .channel("rt-temp-leituras")
      .on("postgres_changes", { event: "*", schema: "public", table: "temp_leituras" }, (payload) => {
        const row: any = (payload as any).new || (payload as any).old;
        if (row?.loja_id === lojaId) loadMes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId]);

  async function salvar() {
    if (!lojaId) return;
    if (!localId) return alert("Selecione um local.");

    const t = toNum(temp);
    if (t == null) return alert("Informe a temperatura (ex: 5,2).");

    const u = umid.trim() ? toNum(umid) : null;
    if (umid.trim() && u == null) return alert("Umidade inválida (ex: 55).");

    if (!assinatura.trim()) return alert("Informe a assinatura (responsável).");

    setSaving(true);

    const { error } = await supabase.from("temp_leituras").insert({
      loja_id: lojaId,
      local_id: localId,
      temp_c: t,
      umid_pct: u,
      observacao: obs.trim() ? obs.trim() : null,
      origem: "manual",
      turno,
      assinatura: assinatura.trim(),
      // lida_em: default now() no banco (já existe)
    });

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Erro ao salvar: " + error.message);
      return;
    }

    setTemp("");
    setUmid("");
    setObs("");
    await loadMes();
    alert("Leitura registrada ✅");
  }

  function gerarPDF() {
    // impressão simples (salvar como PDF)
    window.print();
  }

  const mesTitulo = useMemo(() => monthLabelPtBr(), []);

  return (
    <div className="p-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Registro de Temperatura e Umidade</h1>
          <p className="text-sm opacity-70">Planilha do mês: {mesTitulo}</p>
        </div>

        <button onClick={gerarPDF} className="rounded border px-3 py-2 text-sm hover:bg-black/5">
          Gerar PDF
        </button>
      </div>

      {/* FORM */}
      <div className="mt-4 rounded border p-4">
        <label className="block">
          <span className="text-sm">Local</span>
          <select
            className="mt-1 w-full rounded border p-2"
            value={localId}
            onChange={(e) => setLocalId(e.target.value)}
            disabled={loadingLocais}
          >
            {locais.length === 0 ? <option value="">Nenhum local cadastrado</option> : null}
            {locais.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome} ({l.tipo})
              </option>
            ))}
          </select>
        </label>

        {/* LIMITES (min/max e umidade min/max) */}
        <div className="mt-3 rounded bg-black/5 p-3 text-sm">
          {localSel ? (
            <>
              <div>
                <b>Temp (mín/máx):</b> {localSel.temp_min}°C — {localSel.temp_max}°C
              </div>
              <div className="opacity-80">
                <b>Umid (mín/máx):</b> {localSel.umid_min ?? "—"}% — {localSel.umid_max ?? "—"}%
              </div>
            </>
          ) : (
            <div className="opacity-70">Selecione um local para ver os limites.</div>
          )}
        </div>

        {/* Turno + Assinatura */}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-sm">Turno</span>
            <select className="mt-1 w-full rounded border p-2" value={turno} onChange={(e) => setTurno(e.target.value as any)}>
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm">Assinatura (responsável)</span>
            <input
              className="mt-1 w-full rounded border p-2"
              value={assinatura}
              onChange={(e) => setAssinatura(e.target.value)}
              placeholder="Ex: Maria Silva"
            />
          </label>
        </div>

        {/* Campos (temp atual + umidade atual) */}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-sm">Temperatura atual (°C)</span>
            <input
              className="mt-1 w-full rounded border p-2"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              inputMode="decimal"
              placeholder="ex: 5,2"
            />
          </label>

          <label className="block">
            <span className="text-sm">Umidade atual (%)</span>
            <input
              className="mt-1 w-full rounded border p-2"
              value={umid}
              onChange={(e) => setUmid(e.target.value)}
              inputMode="decimal"
              placeholder="ex: 55"
            />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="text-sm">Observação</span>
          <textarea className="mt-1 w-full rounded border p-2" rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
        </label>

        <button
          onClick={salvar}
          disabled={saving || locais.length === 0}
          className="mt-4 rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Registrar"}
        </button>
      </div>

      {/* PLANILHA DO MÊS (igual vigilância) */}
      <div className="mt-6 rounded border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Planilha do mês</div>
            <div className="text-sm opacity-70">{loadingMes ? "Carregando…" : `${leituras.length} registro(s) no mês`}</div>
          </div>
        </div>

        {loadingMes ? (
          <div className="mt-3 text-sm">Carregando…</div>
        ) : leituras.length === 0 ? (
          <div className="mt-3 text-sm opacity-70">Nenhuma leitura registrada no mês ainda.</div>
        ) : (
          <div className="mt-3 overflow-auto">
            <table className="min-w-[1200px] w-full border-collapse text-sm">
              <thead>
                <tr className="bg-black/5">
                  <th className="border p-2">Dia</th>
                  <th className="border p-2">Turno</th>
                  <th className="border p-2">Hora</th>
                  <th className="border p-2">Local</th>
                  <th className="border p-2">Temp mín</th>
                  <th className="border p-2">Temp atual</th>
                  <th className="border p-2">Temp máx</th>
                  <th className="border p-2">Umidade (%)</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Ass.</th>
                  <th className="border p-2">Obs</th>
                </tr>
              </thead>
              <tbody>
                {leituras.map((r) => {
                  const loc = locais.find((l) => l.id === r.local_id);
                  const dt = new Date(r.lida_em);
                  const dia = dt.getDate().toString().padStart(2, "0");
                  const hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                  const ok = (r.status || "").toLowerCase() === "ok";

                  return (
                    <tr key={r.id} className={!ok ? "bg-red-50" : ""}>
                      <td className="border p-2">{dia}</td>
                      <td className="border p-2">{(r.turno || "").toLowerCase() === "tarde" ? "Tarde" : "Manhã"}</td>
                      <td className="border p-2">{hora}</td>
                      <td className="border p-2">{loc?.nome || r.local_id}</td>
                      <td className="border p-2">{loc?.temp_min ?? "—"}</td>
                      <td className="border p-2">{r.temp_c}</td>
                      <td className="border p-2">{loc?.temp_max ?? "—"}</td>
                      <td className="border p-2">{r.umid_pct ?? "—"}</td>
                      <td className="border p-2 font-semibold" style={{ color: ok ? "#0a7" : "#c00" }}>
                        {r.status}
                      </td>
                      <td className="border p-2">{r.assinatura || "—"}</td>
                      <td className="border p-2">{r.observacao || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-2 text-xs opacity-60">
              * Linha em vermelho quando o status não for OK (seu trigger do banco já classifica automaticamente).
            </div>
          </div>
        )}
      </div>

      {/* impressão mais limpa */}
      <style jsx global>{`
        @media print {
          header,
          nav,
          aside,
          button,
          a,
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
          table {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}